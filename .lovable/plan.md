

# Fix Document Storage and Improve Multi-Document Upload

## Problem Summary
1. "Failed to retrieve documents from storage" error appears when downloading documents from the employee list
2. Documents uploaded during employee creation are not persisting to S3 storage
3. Some document upload fields in the "Add Employee" form only accept single files when they should accept multiple

## Root Cause Analysis
- The S3 upload flow (presigned URL -> PUT to S3 -> attach key) is correctly implemented in the API service, but **error handling needs improvement** to surface exactly which step fails
- The "Download Documents" action fails because the backend may not support the `/employees-full/{id}/documents` endpoint yet, and the error message is too generic
- Several document fields (NIN, Passport, CV, Education Certificate) use single-file inputs when multi-file support would be more practical

## Planned Changes

### 1. Improve Error Handling and Debugging in Upload Flow
**File: `src/lib/api.ts`**
- Add more descriptive error messages at each step of the `uploadDocument` orchestrator (step 1: get URL, step 2: S3 PUT, step 3: attach) so the user sees exactly which step failed
- Handle CORS errors on the S3 PUT request gracefully with a user-friendly message

### 2. Make All Document Inputs Support Multiple Files
**File: `src/pages/Employees.tsx` (Add Employee dialog)**
- Convert single-file fields (NIN Document, Passport Photo, CV, Education Certificate) to multi-file inputs with `multiple` attribute
- Update state from single `File | null` to `File[]` arrays for consistency
- Update the post-creation upload loop to handle all fields as arrays
- Show selected file count/names for each field

### 3. Improve Download Documents Error Handling
**File: `src/pages/Employees.tsx`**
- Make the "Download Documents" action show a more specific error when the backend endpoint is unavailable
- Add a fallback message suggesting to use the Documents tab on the employee profile instead

### 4. Add Upload Progress Feedback to Add Employee Form
**File: `src/pages/Employees.tsx`**
- After employee creation, show progress feedback while documents are uploading to S3
- Show a summary of which documents uploaded successfully and which failed
- Keep the dialog open until all uploads complete so the user can see the results

## Technical Details

### State Changes in `newEmployee`
```text
Before:                          After:
ninDocument: File | null    -->  ninDocuments: File[]
passportPhoto: File | null  -->  passportPhotos: File[]
cv: File | null             -->  cvFiles: File[]
educationCertificate: File  -->  educationCertificates: File[]
```

### Upload Loop Update
The `handleAddEmployee` function will iterate all document arrays uniformly, mapping each to its S3 document type:
```text
ninDocuments       -> national_id
passportPhotos     -> passport
cvFiles            -> onboarding
educationCerts     -> certificate
certifications     -> certificate
companyAssets       -> contract
otherDocuments     -> supporting_docs
```

### Error Message Improvements
- Step 1 fail: "Could not get upload URL from server. The document API may not be configured."
- Step 2 fail: "File upload to storage failed. Check file size and format."
- Step 3 fail: "File uploaded but could not link to employee record."

