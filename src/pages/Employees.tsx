import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateInput } from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Eye,
  MoreHorizontal,
  CalendarIcon,
  FileText,
  Trash2,
  KeyRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { parseCSVFile, formatDataForPHP, type EmployeeData } from "@/utils/csvImport";
import { downloadCSVTemplate, downloadTemplateGuide } from "@/utils/csvTemplate";
import { validateCSVData, CSVValidationResult, ValidatedRow } from "@/utils/csvValidation";
import { CSVValidationPreview } from "@/components/CSVValidationPreview";
import Papa from "papaparse";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import apiService, { Employee } from "@/lib/api";
import { useLocation } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { ROLES } from "@/constants/roles";
import { PERMISSIONS } from "@/constants/roles";
import { ROLE_OPTIONS, ROLE_PREFIX } from "@/constants/roles";
import { EmployeeCredentialsModal } from "@/components/EmployeeCredentialsModal";
import { useAuth } from "@/contexts/AuthContext";

// Put near top of file
const VALID_SYSTEM_ROLES = new Set([
  "executive",
  "hr_manager",
  "corporate_hr",
  "line_manager",
  "finance",
  "it_power_user",
  "contract_employee",
  "general_employee",
]);

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterEmploymentType, setFilterEmploymentType] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [formErrors, setFormErrors] = useState<{ [key: string]: boolean }>({});
  const [currentTab, setCurrentTab] = useState("personal");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [systemRole, setSystemRole] = useState<string>("");
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState<any>(null);
  const [newEmployeeName, setNewEmployeeName] = useState<string>("");
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState<any>(null);
  const [editSystemRole, setEditSystemRole] = useState<string>(""); // Add this line
  const [showValidationPreview, setShowValidationPreview] = useState(false);
  const [validationResult, setValidationResult] = useState<CSVValidationResult | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [newEmployee, setNewEmployee] = useState({
    // Personal Information
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: undefined as Date | undefined,
    gender: "",
    maritalStatus: "",
    nationality: "",
    phoneNumber: "",
    email: "",
    homeAddress: "",
    emergencyContact: "",
    emergencyContactNumber: "",
    nextOfKinName: "",
    nextOfKinRelationship: "",
    nextOfKinPhone: "",
    nextOfKinAddress: "",
    nextOfKinEmail: "",
    // Job Information
    jobTitle: "",
    department: "",
    employmentType: "",
    gradeLevel: "",
    supervisorName: "",
    workLocation: "",
    hireDate: undefined as Date | undefined,
    probationPeriod: "",
    confirmationDate: undefined as Date | undefined,
    employmentStatus: "Active",
    // Financial Information
    grossSalary: "",
    basicSalary: "",
    housingAllowance: "",
    transportAllowance: "",
    otherAllowance: "",
    mealAllowance: "", // Add this missing property
    // Contract Information
    contractAmount: "",
    paymentFrequency: "",
    contractDuration: "",
    contractTerms: "",
    bankAccount: "",
    // Banking Information
    bankName: "",
    accountNumber: "",
    nuban: "",
    sortCode: "",
    // Government IDs
    employeeId: "",
    nationalId: "",
    passportNumber: "",
    tin: "",
    pensionPin: "",
    nhfNumber: "",
    taxId: "",
    bvn: "", // Add this missing property
    // Additional Fields
    vacationDays: "",
    // Document uploads
    ninDocument: null as File | null,
    passportPhoto: null as File | null,
    certifications: [] as File[],
    cv: null as File | null,
    educationCertificate: null as File | null,
    otherDocuments: [] as File[],
    companyAssets: [] as File[],
    lastCompanyAsset: null as File | null,
  });

  // Import from constants for consistency
  const departments = [
    "Executive",
    "Human Resources",
    "Technical Operations",
    "Business Development",
    "Finance",
    "IT",
    "Operations",
    "Marketing",
    "Sales",
    "Customer Service",
    "Procurement",
  ];
  const gradeLevels = ["Junior", "Middle", "Senior", "Executive"];

  const nationalities = [
    "Afghan",
    "Albanian",
    "Algerian",
    "American",
    "Andorran",
    "Angolan",
    "Argentinian",
    "Armenian",
    "Australian",
    "Austrian",
    "Azerbaijani",
    "Bahamian",
    "Bahraini",
    "Bangladeshi",
    "Barbadian",
    "Belarusian",
    "Belgian",
    "Belizean",
    "Beninese",
    "Bhutanese",
    "Bolivian",
    "Bosnian",
    "Brazilian",
    "British",
    "Bruneian",
    "Bulgarian",
    "Burkinabe",
    "Burmese",
    "Burundian",
    "Cambodian",
    "Cameroonian",
    "Canadian",
    "Cape Verdean",
    "Central African",
    "Chadian",
    "Chilean",
    "Chinese",
    "Colombian",
    "Comoran",
    "Congolese",
    "Costa Rican",
    "Croatian",
    "Cuban",
    "Cypriot",
    "Czech",
    "Danish",
    "Djiboutian",
    "Dominican",
    "Dutch",
    "East Timorese",
    "Ecuadorean",
    "Egyptian",
    "Emirian",
    "Equatorial Guinean",
    "Eritrean",
    "Estonian",
    "Ethiopian",
    "Fijian",
    "Filipino",
    "Finnish",
    "French",
    "Gabonese",
    "Gambian",
    "Georgian",
    "German",
    "Ghanaian",
    "Greek",
    "Grenadian",
    "Guatemalan",
    "Guinea-Bissauan",
    "Guinean",
    "Guyanese",
    "Haitian",
    "Herzegovinian",
    "Honduran",
    "Hungarian",
    "Icelander",
    "Indian",
    "Indonesian",
    "Iranian",
    "Iraqi",
    "Irish",
    "Israeli",
    "Italian",
    "Ivorian",
    "Jamaican",
    "Japanese",
    "Jordanian",
    "Kazakhstani",
    "Kenyan",
    "Kittian and Nevisian",
    "Kuwaiti",
    "Kyrgyz",
    "Laotian",
    "Latvian",
    "Lebanese",
    "Liberian",
    "Libyan",
    "Liechtensteiner",
    "Lithuanian",
    "Luxembourgish",
    "Macedonian",
    "Malagasy",
    "Malawian",
    "Malaysian",
    "Maldivan",
    "Malian",
    "Maltese",
    "Marshallese",
    "Mauritanian",
    "Mauritian",
    "Mexican",
    "Micronesian",
    "Moldovan",
    "Monacan",
    "Mongolian",
    "Moroccan",
    "Mosotho",
    "Motswana",
    "Mozambican",
    "Namibian",
    "Nauruan",
    "Nepalese",
    "New Zealander",
    "Ni-Vanuatu",
    "Nicaraguan",
    "Nigerian",
    "Nigerien",
    "North Korean",
    "Norwegian",
    "Omani",
    "Pakistani",
    "Palauan",
    "Palestinian",
    "Panamanian",
    "Papua New Guinean",
    "Paraguayan",
    "Peruvian",
    "Polish",
    "Portuguese",
    "Qatari",
    "Romanian",
    "Russian",
    "Rwandan",
    "Saint Lucian",
    "Salvadoran",
    "Samoan",
    "San Marinese",
    "Sao Tomean",
    "Saudi",
    "Scottish",
    "Senegalese",
    "Serbian",
    "Seychellois",
    "Sierra Leonean",
    "Singaporean",
    "Slovakian",
    "Slovenian",
    "Solomon Islander",
    "Somali",
    "South African",
    "South Korean",
    "Spanish",
    "Sri Lankan",
    "Sudanese",
    "Surinamer",
    "Swazi",
    "Swedish",
    "Swiss",
    "Syrian",
    "Taiwanese",
    "Tajik",
    "Tanzanian",
    "Thai",
    "Togolese",
    "Tongan",
    "Trinidadian or Tobagonian",
    "Tunisian",
    "Turkish",
    "Tuvaluan",
    "Ugandan",
    "Ukrainian",
    "Uruguayan",
    "Uzbekistani",
    "Venezuelan",
    "Vietnamese",
    "Welsh",
    "Yemenite",
    "Zambian",
    "Zimbabwean",
  ];
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Check if Add Employee dialog should open on page load
  useEffect(() => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("add") === "true") {
      setShowAddEmployee(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check navigation state from Dashboard
    if (location.state?.openAddDialog) {
      setShowAddEmployee(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  // Add this function to fetch employees
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getEmployees();
      setEmployeeList(data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this useEffect to load employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employeeList.filter((employee) => {
    const matchesSearch =
      employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.job_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      !filterLocation ||
      filterLocation === "all" ||
      (employee.work_location && employee.work_location === filterLocation);
    const matchesDepartment =
      !filterDepartment ||
      filterDepartment === "all" ||
      (employee.department && employee.department === filterDepartment);
    const matchesEmploymentType =
      !filterEmploymentType ||
      filterEmploymentType === "all" ||
      (employee.employment_type && employee.employment_type === filterEmploymentType);
    const matchesStartDate = !filterStartDate || (employee.hire_date && employee.hire_date === filterStartDate);

    // Department-aware filtering for line managers
    const matchesDepartmentAccess =
      user?.role === "hr_manager" || user?.role === "executive" || user?.role === "corporate_hr" // HR, Execs, and Corporate HR see all
        ? true
        : user?.role === "line_manager" && user?.department // Line managers see only their department
          ? employee.department === user.department
          : user?.role === "general_employee" || user?.role === "finance" // Employees see only themselves
            ? employee.email === user.email
            : true; // Other roles see all (fallback)

    return (
      matchesSearch &&
      matchesLocation &&
      matchesDepartment &&
      matchesEmploymentType &&
      matchesStartDate &&
      matchesDepartmentAccess
    );
  });

  // Get unique values for filter dropdowns
  const uniqueLocations = [...new Set(employeeList.map((emp) => emp.work_location))].filter(Boolean);
  // Use official departments list instead of unique values from employees
  const uniqueDepartments = departments;
  const uniqueEmploymentTypes = [...new Set(employeeList.map((emp) => emp.employment_type))].filter(Boolean);

  // Calculate confirmation date based on hire date and probation period
  const calculateConfirmationDate = (hireDate: Date | undefined, probationMonths: string) => {
    if (!hireDate || !probationMonths) return undefined;

    const months = parseInt(probationMonths);
    if (isNaN(months)) return undefined;

    const confirmationDate = new Date(hireDate);
    confirmationDate.setMonth(confirmationDate.getMonth() + months);
    return confirmationDate;
  };

  // Auto-calculate confirmation date when hire date or probation period changes
  useEffect(() => {
    const confirmationDate = calculateConfirmationDate(newEmployee.hireDate, newEmployee.probationPeriod);
    if (confirmationDate && confirmationDate !== newEmployee.confirmationDate) {
      setNewEmployee((prev) => ({
        ...prev,
        confirmationDate,
      }));
    }
  }, [newEmployee.hireDate, newEmployee.probationPeriod]);

  // Auto-calculate salary components for Full-time employees
  useEffect(() => {
    if (newEmployee.employmentType === "Full-time" && newEmployee.grossSalary) {
      const gross = parseFloat(newEmployee.grossSalary) || 0;
      const basicSalary = (gross * 0.4).toString();
      const housingAllowance = (gross * 0.2).toString();
      const transportAllowance = (gross * 0.09).toString();
      const otherAllowance = (gross * 0.31).toString();

      setNewEmployee((prev) => ({
        ...prev,
        basicSalary,
        housingAllowance,
        transportAllowance,
        otherAllowance,
      }));
    }
  }, [newEmployee.grossSalary, newEmployee.employmentType]);

  // Validate required fields
  const validateRequiredFields = (tab: string) => {
    const errors: {
      [key: string]: boolean;
    } = {};
    if (tab === "personal") {
      if (!newEmployee.firstName.trim()) errors.firstName = true;
      if (!newEmployee.lastName.trim()) errors.lastName = true;
      if (!newEmployee.phoneNumber.trim()) errors.phoneNumber = true;
      if (!newEmployee.email.trim()) errors.email = true;
      if (!newEmployee.nationality.trim()) errors.nationality = true;
      if (!newEmployee.dateOfBirth) errors.dateOfBirth = true;
      if (!newEmployee.gender.trim()) errors.gender = true;
      if (!newEmployee.maritalStatus.trim()) errors.maritalStatus = true;
      if (!newEmployee.homeAddress.trim()) errors.homeAddress = true;
      if (!newEmployee.emergencyContact.trim()) errors.emergencyContact = true;
      if (!newEmployee.emergencyContactNumber.trim()) errors.emergencyContactNumber = true;
      if (!newEmployee.nextOfKinName.trim()) errors.nextOfKinName = true;
      if (!newEmployee.nextOfKinRelationship.trim()) errors.nextOfKinRelationship = true;
      if (!newEmployee.nextOfKinPhone.trim()) errors.nextOfKinPhone = true;
      if (!newEmployee.nextOfKinAddress.trim()) errors.nextOfKinAddress = true;
      if (!newEmployee.nextOfKinEmail.trim()) errors.nextOfKinEmail = true;
    } else if (tab === "job") {
      if (!newEmployee.jobTitle.trim()) errors.jobTitle = true;
      if (!newEmployee.department.trim()) errors.department = true;
      if (!newEmployee.employmentType.trim()) errors.employmentType = true;
      if (!newEmployee.gradeLevel.trim()) errors.gradeLevel = true;
      if (!newEmployee.supervisorName.trim()) errors.supervisorName = true;
      if (!newEmployee.workLocation.trim()) errors.workLocation = true;
      if (!newEmployee.hireDate) errors.hireDate = true;
      if (!newEmployee.probationPeriod.trim()) errors.probationPeriod = true;
    } else if (tab === "government") {
      if (!newEmployee.nationalId.trim()) errors.nationalId = true;
      // Passport Number is now optional
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Function to check if user can proceed to next tab
  const canProceedToTab = (targetTab: string) => {
    const tabOrder = ["personal", "job", "financial", "government", "additional"];
    const currentIndex = tabOrder.indexOf(currentTab);
    const targetIndex = tabOrder.indexOf(targetTab);
    if (targetIndex <= currentIndex) return true;

    // Check all required tabs before target
    for (let i = 0; i < targetIndex; i++) {
      if (!validateRequiredFields(tabOrder[i])) {
        toast({
          title: "Required Fields Missing",
          description: `Please fill all required fields in the ${tabOrder[i]} section before proceeding.`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  // CSV Import functionality
  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    try {
      setImportFileName(file.name);

      // Parse CSV and validate
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Filter out instruction rows (rows starting with # or containing REQUIRED/CHOOSE/FORMAT)
          const dataRows = results.data.filter((row: any) => {
            const firstValue = Object.values(row)[0] as string;
            if (!firstValue) return false;
            if (firstValue.startsWith("#")) return false;
            if (firstValue.includes("REQUIRED") || firstValue.includes("CHOOSE") || firstValue.includes("FORMAT"))
              return false;
            return true;
          });

          const validationResult = validateCSVData(dataRows as Record<string, string>[]);
          setValidationResult(validationResult);
          setShowValidationPreview(true);
        },
        error: (error) => {
          toast({
            title: "Parse Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      console.error("CSV Import Error:", error);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "An error occurred while importing the CSV file.",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper function to convert DD/MM/YYYY to yyyy-MM-dd
  const convertDateFormat = (dateStr: string): string | null => {
    if (!dateStr || dateStr.trim() === "") return null;
    const parts = dateStr.trim().split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return null;
  };

  const handleConfirmImport = async (validRows: ValidatedRow[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      let lastCredentials: any = null;
      let lastEmployeeName = "";

      for (const row of validRows) {
        try {
          // Map CSV fields to API payload - using the same structure as handleAddEmployee
          const employeeData = {
            first_name: row.data["First Name"] || "",
            last_name: row.data["Last Name"] || "",
            middle_name: row.data["Middle Name"] || "",
            email: row.data["Email Address"] || row.data["Email"] || "",
            dob: convertDateFormat(row.data["Date of Birth"]),
            job_title: row.data["Job Title"] || "",
            gross_salary: parseInt(row.data["Gross Salary"]?.replace(/[₦,]/g, "") || "0") || 0,
            department: row.data["Department"] || "",
            employment_type: row.data["Employment Type"] || "",
            employment_status: row.data["Employment Status"] || "Active",
            hire_date: convertDateFormat(row.data["Hire Date"]) || new Date().toISOString().split("T")[0],
            phone: row.data["Phone Number"] || "",
            address: row.data["Home Address"] || "",
            gender: row.data["Gender"] || "",
            marital_status: row.data["Marital Status"] || "",
            nationality: row.data["Nationality"] || "",
            grade_level: row.data["Grade Level"] || "",
            supervisor_name: row.data["Supervisor Name"] || "",
            work_location: row.data["Work Location"] || "",
            probation_period: row.data["Probation Period (in months)"] || "",
            confirmation_date: convertDateFormat(row.data["Confirmation Date"]),
            vacation_days: parseInt(row.data["Vacation Days (7-30 days)"] || row.data["Vacation Days"] || "20") || 20,

            // Emergency contact
            emergency_contact: row.data["Emergency Contact Name"] || "",
            emergency_phone: row.data["Emergency Contact Phone"] || "",

            // Next of Kin
            next_of_kin_name: row.data["Next of Kin Name"] || "",
            next_of_kin_relationship: row.data["Next of Kin Relationship"] || "",
            next_of_kin_phone: row.data["Next of Kin Phone"] || "",
            next_of_kin_address: row.data["Next of Kin Address"] || "",
            next_of_kin_email: row.data["Next of Kin Email"] || "",

            // Banking Information
            bank_name: row.data["Bank Name"] || "",
            account_number: row.data["Account Number"] || "",
            nuban: row.data["NUBAN"] || "",
            sort_code: row.data["Sort Code"] || "",

            // Government IDs
            national_id: row.data["National ID (NIN)"] || "",
            passport_number: row.data["Passport Number"] || "",
            bvn: row.data["BVN"] || "",
            tin: row.data["Tax Identification Number (TIN)"] || row.data["TIN"] || "",
            pension_pin: row.data["Pension PIN"] || "",
            nhf_number: row.data["NHF Number"] || "",

            // System Role for user account creation - default to general_employee
            system_role: "general_employee",
          };

          const response = await apiService.createEmployee(employeeData);
          successCount++;

          // Store last credentials to show to HR
          if (response.user_credentials) {
            lastCredentials = response.user_credentials;
            lastEmployeeName = `${row.data["First Name"] || ""} ${row.data["Last Name"] || ""}`.trim();
          }
        } catch (rowError) {
          console.error(`Failed to import row ${row.rowNumber}:`, rowError);
          errorCount++;
        }
      }

      // Refresh employee list
      await fetchEmployees();

      // Show credentials modal for the last imported employee (or only employee if just one)
      if (lastCredentials) {
        setNewEmployeeCredentials(lastCredentials);
        setNewEmployeeName(lastEmployeeName);
        setShowCredentialsModal(true);
      }

      if (errorCount > 0) {
        toast({
          title: "Partial Import",
          description: `Imported ${successCount} employee(s). ${errorCount} failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${successCount} employee(s)${validRows.length > 1 ? ". Showing credentials for last employee." : ""}`,
        });
      }
    } catch (error) {
      console.error("Import Error:", error);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to import employees",
        variant: "destructive",
      });
    }
  };
  const handleAddEmployee = async () => {
    // Validate all required fields before adding
    const allTabs = ["personal", "job", "government"];
    let hasErrors = false;
    for (const tab of allTabs) {
      if (!validateRequiredFields(tab)) {
        hasErrors = true;
        break;
      }
    }
    if (hasErrors) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill all required fields before adding the employee.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format the employee data for the API (convert frontend field names to database field names)
      const employeeData = {
        first_name: newEmployee.firstName,
        last_name: newEmployee.lastName,
        middle_name: newEmployee.middleName,
        email: newEmployee.email,
        dob: newEmployee.dateOfBirth ? format(newEmployee.dateOfBirth, "yyyy-MM-dd") : null,
        job_title: newEmployee.jobTitle,
        gross_salary: newEmployee.grossSalary ? parseInt(newEmployee.grossSalary) : 0,
        department: newEmployee.department,
        employment_type: newEmployee.employmentType,
        employment_status: newEmployee.employmentStatus || "Active",
        hire_date: newEmployee.hireDate
          ? format(newEmployee.hireDate, "yyyy-MM-dd")
          : new Date().toISOString().split("T")[0],
        phone: newEmployee.phoneNumber,
        address: newEmployee.homeAddress,
        gender: newEmployee.gender,
        marital_status: newEmployee.maritalStatus,
        nationality: newEmployee.nationality,
        grade_level: newEmployee.gradeLevel,
        supervisor_name: newEmployee.supervisorName,
        work_location: newEmployee.workLocation,
        probation_period: newEmployee.probationPeriod,
        confirmation_date: newEmployee.confirmationDate ? format(newEmployee.confirmationDate, "yyyy-MM-dd") : null,
        vacation_days: newEmployee.vacationDays ? parseInt(newEmployee.vacationDays) : 20,

        // Financial Information
        meal_allowance: newEmployee.mealAllowance ? parseInt(newEmployee.mealAllowance) : 0,
        housing_allowance: newEmployee.housingAllowance ? parseInt(newEmployee.housingAllowance) : 0,
        transport_allowance: newEmployee.transportAllowance ? parseInt(newEmployee.transportAllowance) : 0,
        basic_salary: newEmployee.basicSalary ? parseInt(newEmployee.basicSalary) : 0,
        other_allowance: newEmployee.otherAllowance ? parseInt(newEmployee.otherAllowance) : 0,

        // Banking Information
        bank_account: newEmployee.bankAccount,
        bank_name: newEmployee.bankName,
        account_number: newEmployee.accountNumber,
        nuban: newEmployee.nuban,
        sort_code: newEmployee.sortCode,

        // Government ID Information
        employee_code:
          newEmployee.employeeId ||
          (systemRole ? getNextEmployeeCode(systemRole) : `EMP${String(employeeList.length + 1).padStart(3, "0")}`),
        national_id: newEmployee.nationalId,
        passport_number: newEmployee.passportNumber,
        bvn: newEmployee.bvn,
        tin: newEmployee.tin,
        pension_pin: newEmployee.pensionPin,
        nhf_number: newEmployee.nhfNumber,
        tax_id: newEmployee.taxId,

        // System Role for user account creation
        system_role: systemRole || null,
      };

      console.log("Sending employee data to API:", employeeData); // Debug log
      console.log("System role:", systemRole); // Debug log
      console.log("Generated employee code:", newEmployee.employeeId); // Debug log

      // Call the API to create the employee
      const response = await apiService.createEmployee(employeeData);

      // Refresh the employee list from the database
      await fetchEmployees();

      // If user credentials were created, show them to HR
      if (response.user_credentials) {
        setNewEmployeeCredentials(response.user_credentials);
        setNewEmployeeName(`${newEmployee.firstName} ${newEmployee.lastName}`);
        setShowCredentialsModal(true);
      }

      // Reset the form
      setNewEmployee({
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: undefined,
        gender: "",
        maritalStatus: "",
        nationality: "",
        phoneNumber: "",
        email: "",
        homeAddress: "",
        emergencyContact: "",
        emergencyContactNumber: "",
        nextOfKinName: "",
        nextOfKinRelationship: "",
        nextOfKinPhone: "",
        nextOfKinAddress: "",
        nextOfKinEmail: "",
        jobTitle: "",
        department: "",
        employmentType: "",
        gradeLevel: "",
        supervisorName: "",
        workLocation: "",
        hireDate: undefined,
        probationPeriod: "",
        confirmationDate: undefined,
        employmentStatus: "Active",
        grossSalary: "",
        basicSalary: "",
        housingAllowance: "",
        transportAllowance: "",
        otherAllowance: "",
        mealAllowance: "",
        paymentFrequency: "",
        contractDuration: "",
        contractTerms: "",
        bankAccount: "",
        bankName: "",
        accountNumber: "",
        nuban: "",
        sortCode: "",
        employeeId: "",
        nationalId: "",
        passportNumber: "",
        tin: "",
        pensionPin: "",
        nhfNumber: "",
        taxId: "",
        bvn: "",
        contractAmount: "",
        vacationDays: "",
        ninDocument: null,
        passportPhoto: null,
        certifications: [],
        cv: null,
        educationCertificate: null,
        otherDocuments: [],
        companyAssets: [],
        lastCompanyAsset: null,
      });

      // Reset system role
      setSystemRole("");

      setShowAddEmployee(false);
      toast({
        title: "Success",
        description: "Employee added successfully!",
      });
    } catch (error) {
      console.error("Failed to create employee:", error);
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getNextEmployeeCode = (roleValue: string): string => {
    const prefix = ROLE_PREFIX[roleValue] || "EMP";
    const existing = (employeeList || [])
      .map((e) => e.employee_code)
      .filter(Boolean)
      .filter((code) =>
        String(code as string)
          .toUpperCase()
          .startsWith(prefix),
      );
    const maxNum = existing.reduce((max, code) => {
      const n = parseInt(String(code).slice(prefix.length), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const next = maxNum + 1;
    return `${prefix}${String(next).padStart(3, "0")}`;
  };
  const handleEditEmployee = (employee: Employee) => {
    setEditEmployee({
      // Employee ID - Format it properly
      id: employee.id,
      employeeId: employee.employee_code || `EMP${employee.id?.toString().padStart(3, "0")}` || "",

      // Personal Information - Map database fields to form fields
      firstName: employee.first_name || "",
      lastName: employee.last_name || "",
      middleName: "", // This field doesn't exist in database
      dateOfBirth: employee.dob ? new Date(employee.dob) : undefined,
      gender: employee.gender || "",
      maritalStatus: employee.marital_status || "",
      nationality: employee.nationality || "",
      phoneNumber: employee.phone_number || "",
      email: employee.email || "",
      homeAddress: employee.address || "",

      // Emergency Contact Information
      emergencyContact: "",
      emergencyContactNumber: "",
      nextOfKinName: "",
      nextOfKinRelationship: "",
      nextOfKinPhone: "",
      nextOfKinAddress: "",
      nextOfKinEmail: "",

      // Job Information
      jobTitle: employee.job_title || "",
      department: employee.department || "",
      employment_type: employee.employment_type || "",
      grade_level: employee.grade_level || "",
      supervisor_name: employee.supervisor_name || "",
      work_location: employee.work_location || "",
      hireDate: employee.hire_date ? new Date(employee.hire_date) : undefined,
      probation_period: employee.probation_period || "",
      confirmation_date: employee.confirmation_date ? new Date(employee.confirmation_date) : undefined,
      employment_status: employee.employment_status || "Active",

      // Financial Information
      gross_salary: employee.gross_salary?.toString() || "",
      basic_salary: "",
      housing_allowance: employee.housing_allowance?.toString() || "",
      transport_allowance: employee.transport_allowance?.toString() || "",
      other_allowance: "",
      meal_allowance: employee.meal_allowance?.toString() || "",

      // Banking Information
      bank_account: employee.bank_account || "",
      bank_name: "",
      account_number: "",
      nuban: "",
      sort_code: "",

      // Government IDs
      national_id: employee.national_id || "",
      passport_number: "",
      tin: employee.tin || "",
      pension_pin: employee.pension_pin || "",
      nhf_number: employee.nhf_number || "",
      tax_id: employee.tax_id || "",
      bvn: employee.bvn || "",

      // Additional
      vacation_days: employee.vacation_days?.toString() || "",

      // Contract Information (if available in database)
      contract_amount: "",
      payment_frequency: "",
      contract_duration: "",
      contract_terms: "",

      // Document fields (set to null for now)
      ninDocument: null,
      passportPhoto: null,
      certifications: [],
      cv: null,
    });

    // Set the edit system role based on existing user role
    setEditSystemRole("");

    setShowEditEmployee(true);
  };
  const handleUpdateEmployee = async () => {
    try {
      if (!editEmployee.id) {
        toast({
          title: "Error",
          description: "Employee ID is required",
          variant: "destructive",
        });
        return;
      }

      // Format the employee data for the API
      const employeeData = {
        first_name: editEmployee.firstName,
        last_name: editEmployee.lastName,
        // Remove middle_name - doesn't exist in database
        email: editEmployee.email,
        phone_number: editEmployee.phoneNumber, // Fixed: use phone_number
        job_title: editEmployee.jobTitle,
        department: editEmployee.department,
        employment_type: editEmployee.employment_type,
        employment_status: editEmployee.employment_status || "Active",
        hire_date: editEmployee.hireDate ? format(editEmployee.hireDate, "yyyy-MM-dd") : editEmployee.joinDate,
        address: editEmployee.homeAddress,
        gender: editEmployee.gender,
        marital_status: editEmployee.maritalStatus,
        nationality: editEmployee.nationality,
        grade_level: editEmployee.grade_level,
        supervisor_name: editEmployee.supervisor_name,
        work_location: editEmployee.work_location,
        probation_period: editEmployee.probation_period,
        confirmation_date: editEmployee.confirmation_date ? format(editEmployee.confirmation_date, "yyyy-MM-dd") : null,
        vacation_days: editEmployee.vacation_days ? parseInt(editEmployee.vacation_days) : 20,

        // Financial Information
        gross_salary: editEmployee.gross_salary ? parseInt(editEmployee.gross_salary) : 0,
        basic_salary: editEmployee.basic_salary ? parseInt(editEmployee.basic_salary) : 0,
        meal_allowance: editEmployee.meal_allowance ? parseInt(editEmployee.meal_allowance) : 0,
        housing_allowance: editEmployee.housing_allowance ? parseInt(editEmployee.housing_allowance) : 0,
        transport_allowance: editEmployee.transport_allowance ? parseInt(editEmployee.transport_allowance) : 0,
        other_allowance: editEmployee.other_allowance ? parseInt(editEmployee.other_allowance) : 0,

        // Banking Information
        bank_account: editEmployee.bank_account,
        bank_name: editEmployee.bank_name,
        account_number: editEmployee.account_number,
        nuban: editEmployee.nuban,
        sort_code: editEmployee.sort_code,

        // Government ID Information
        employee_code: editEmployee.employeeId,
        national_id: editEmployee.national_id,
        bvn: editEmployee.bvn,
        tin: editEmployee.tin,
        pension_pin: editEmployee.pension_pin,
        nhf_number: editEmployee.nhf_number,
        tax_id: editEmployee.tax_id,

        // System Role for user account update
        system_role: editSystemRole || null,
      };

      // Call the API to update the employee
      await apiService.updateEmployee(editEmployee.id, employeeData);

      // Refresh the employee list from the database
      await fetchEmployees();

      toast({
        title: "Success",
        description: "Employee updated successfully",
      });

      setShowEditEmployee(false);
      setEditSystemRole(""); // Reset edit system role
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    }
  };
  const handleResignEmployee = async (employee: Employee) => {
    if (
      window.confirm(
        `Are you sure you want to resign ${employee.first_name} ${employee.last_name}? This will move them to the former employees archive.`,
      )
    ) {
      try {
        const resignationData = {
          resignation_date: new Date().toISOString().split("T")[0],
          resignation_reason: "Resigned via HRIS system",
          retention_period_months: 12,
        };

        // Call the API to resign the employee
        await apiService.resignEmployee(employee.id!, resignationData);

        // Remove from local state
        setEmployeeList((prev) => prev.filter((emp) => emp.id !== employee.id));

        toast({
          title: "Employee Resigned",
          description: `${employee.first_name} ${employee.last_name} has been resigned and moved to former employees archive.`,
        });
      } catch (error) {
        console.error("Error resigning employee:", error);
        toast({
          title: "Resignation Failed",
          description: "Failed to resign employee. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleResetPassword = async (employee: Employee) => {
    if (!employee.id || !employee.user_id) {
      toast({
        title: "Cannot Reset Password",
        description: "This employee doesn't have a user account",
        variant: "destructive",
      });
      return;
    }

    if (
      window.confirm(
        `Reset password for ${employee.first_name} ${employee.last_name}? They will need to change it on next login.`,
      )
    ) {
      try {
        const response = await apiService.resetUserPassword(employee.user_id, employee.id);

        // Show credentials modal with new temp password
        setNewEmployeeCredentials(response.user_credentials);
        setNewEmployeeName(`${employee.first_name} ${employee.last_name}`);
        setShowCredentialsModal(true);

        toast({
          title: "Password Reset",
          description: "New temporary password generated. Please share with employee.",
        });
      } catch (error) {
        console.error("Error resetting password:", error);
        toast({
          title: "Reset Failed",
          description: "Failed to reset password. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  const handleDownloadProfile = (employee: any) => {
    const pdf = new jsPDF();

    // Title
    pdf.setFontSize(20);
    pdf.text("Employee Profile", 20, 30);

    // Employee basic info
    pdf.setFontSize(12);
    pdf.text(`Name: ${employee.firstName} ${employee.lastName}`, 20, 50);
    pdf.text(`Employee ID: ${employee.id}`, 20, 60);
    pdf.text(`Email: ${employee.email}`, 20, 70);
    pdf.text(`Phone: ${employee.phone || employee.phoneNumber || "N/A"}`, 20, 80);
    pdf.text(`Department: ${employee.department}`, 20, 90);
    pdf.text(`Position: ${employee.position || employee.jobTitle}`, 20, 100);
    pdf.text(`Employment Type: ${employee.employmentType}`, 20, 110);
    pdf.text(`Status: ${employee.status || employee.employmentStatus}`, 20, 120);
    pdf.text(`Hire Date: ${employee.joinDate || employee.hireDate || "N/A"}`, 20, 130);

    // Financial info
    pdf.text(`Salary: ${employee.salary || employee.grossSalary || "N/A"}`, 20, 150);
    if (employee.housingAllowance) pdf.text(`Housing Allowance: ${employee.housingAllowance}`, 20, 160);
    if (employee.transportAllowance) pdf.text(`Transport Allowance: ${employee.transportAllowance}`, 20, 170);
    if (employee.otherAllowance) pdf.text(`Other Allowance: ${employee.otherAllowance}`, 20, 180);
    pdf.save(`${employee.firstName}_${employee.lastName}_profile.pdf`);
    toast({
      title: "Profile Downloaded",
      description: `${employee.firstName} ${employee.lastName}'s profile has been downloaded as PDF.`,
    });
  };
  const handleExportData = () => {
    const exportData = employeeList.map((emp: any) => ({
      // Personal Information
      "Employee ID": emp.id || emp.employeeId || "",
      "First Name": emp.firstName || "",
      "Middle Name": emp.middleName || "",
      "Last Name": emp.lastName || "",
      "Date of Birth": emp.dateOfBirth ? format(new Date(emp.dateOfBirth), "yyyy-MM-dd") : "",
      Gender: emp.gender || "",
      "Marital Status": emp.maritalStatus || "",
      Nationality: emp.nationality || "",
      "Phone Number": emp.phone || emp.phoneNumber || "",
      Email: emp.email || "",
      "Home Address": emp.homeAddress || "",
      "Emergency Contact Name": emp.emergencyContact || "",
      "Emergency Contact Number": emp.emergencyContactNumber || "",
      "Next of Kin Name": emp.nextOfKinName || "",
      "Next of Kin Relationship": emp.nextOfKinRelationship || "",
      "Next of Kin Phone": emp.nextOfKinPhone || "",
      "Next of Kin Address": emp.nextOfKinAddress || "",
      "Next of Kin Email": emp.nextOfKinEmail || "",

      // Job Information
      "Job Title": emp.position || emp.jobTitle || "",
      Department: emp.department || "",
      "Employment Type": emp.employmentType || "",
      "Grade Level": emp.gradeLevel || "",
      "Supervisor Name": emp.supervisorName || "",
      "Work Location": emp.workLocation || "",
      "Hire Date": emp.joinDate || emp.hireDate || "",
      "Probation Period": emp.probationPeriod || "",
      "Confirmation Date": emp.confirmationDate ? format(new Date(emp.confirmationDate), "yyyy-MM-dd") : "",
      "Employment Status": emp.status || emp.employmentStatus || "",

      // Financial Information
      "Gross Salary": emp.salary || emp.grossSalary || "",
      "Basic Salary": emp.basicSalary || "",
      "Housing Allowance": emp.housingAllowance || "",
      "Transport Allowance": emp.transportAllowance || "",
      "Other Allowances": emp.otherAllowance || "",
      "Bank Account": emp.bankAccount || "",

      // Banking Information
      "Bank Name": emp.bankName || "",
      "Account Number": emp.accountNumber || "",
      NUBAN: emp.nuban || "",
      "Sort Code": emp.sortCode || "",

      // Government IDs
      "National ID": emp.nationalId || "",
      "Passport Number": emp.passportNumber || "",
      TIN: emp.tin || "",
      "Pension PIN": emp.pensionPin || "",
      "NHF Number": emp.nhfNumber || "",
      "Tax ID": emp.taxId || "",

      // Additional Fields
      "Vacation Days": emp.vacationDays || 0,
      // Note: Excluding additional documents as requested
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, "employees_export.xlsx");
    toast({
      title: "Data Exported",
      description: "Employee data has been exported to Excel file (excluding additional documents).",
    });
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">Active</Badge>;
      case "On-Leave":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 text-xs whitespace-nowrap shrink-0">
            On-Leave
          </Badge>
        );
      case "Time-Off":
        return (
          <Badge className="bg-info/10 text-info border-info/20 text-xs whitespace-nowrap shrink-0">Time-Off</Badge>
        );
      case "On-board":
        return <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">On-board</Badge>;
      case "On Leave":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 text-xs whitespace-nowrap shrink-0">
            On Leave
          </Badge>
        );
      case "Terminated":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Terminated</Badge>;
      case "Resigned":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs">
            Resigned
          </Badge>
        );
      case "Inactive":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Inactive</Badge>;
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  // Add this simple test function to test phone number update:

  const testPhoneUpdate = async (employeeId: number, phoneNumber: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/employees-full/${employeeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          first_name: "Test", // Required field
          last_name: "Test", // Required field
          email: "test@test.com", // Required field
          phone: phoneNumber, // This is what we want to test
          job_title: "Test", // Required field
          department: "Test", // Required field
          employment_type: "Full-time", // Required field
          employment_status: "Active", // Required field
          hire_date: "2024-01-01", // Required field
        }),
      });

      if (response.ok) {
        console.log("Phone number updated successfully!");
        toast({
          title: "Success",
          description: "Phone number updated in database",
        });
      } else {
        console.error("Failed to update phone number");
      }
    } catch (error) {
      console.error("Error updating phone number:", error);
    }
  };

  return (
    <ProtectedRoute roles={[...PERMISSIONS.EMPLOYEE_MGMT]}>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Employee Records</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage comprehensive employee information and records
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs md:text-sm">
                  <FileText className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                  Download Template
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadCSVTemplate}>
                  <FileText className="mr-2 h-4 w-4" />
                  CSV Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadTemplateGuide}>
                  <FileText className="mr-2 h-4 w-4" />
                  Field Guide (Instructions)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={handleImportCSV}>
              <Upload className="mr-2 h-3 w-3 md:h-4 md:w-4" />
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{
                display: "none",
              }}
            />
            <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={handleExportData}>
              <Download className="mr-2 h-3 w-3 md:h-4 md:w-4" />
              Export Data
            </Button>
            <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs md:text-sm">
                  <Plus className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription className="sr-only">Employee dialog</DialogDescription>
                </DialogHeader>
                <RoleBasedComponent allowedRoles={[...PERMISSIONS.FULL, "corporate_hr"]}>
                  <div className="mt-2 mb-4 space-y-2">
                    <Label>System Role</Label>
                    <Select
                      value={systemRole}
                      onValueChange={(val) => {
                        setSystemRole(val);
                        setNewEmployee((prev) => ({ ...prev, employeeId: getNextEmployeeCode(val) }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a system role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </RoleBasedComponent>
                <Tabs
                  value={currentTab}
                  onValueChange={(tab) => {
                    if (canProceedToTab(tab)) {
                      setCurrentTab(tab);
                    }
                  }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
                    <TabsTrigger value="personal" className="text-xs sm:text-sm">
                      Personal
                    </TabsTrigger>
                    <TabsTrigger value="job" className="text-xs sm:text-sm">
                      Job Info
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="text-xs sm:text-sm">
                      Financial
                    </TabsTrigger>
                    <TabsTrigger value="government" className="text-xs sm:text-sm">
                      Gov IDs
                    </TabsTrigger>
                    <TabsTrigger value="additional" className="text-xs sm:text-sm">
                      Additional
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={newEmployee.firstName}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              firstName: e.target.value,
                            })
                          }
                          className={formErrors.firstName ? "border-destructive" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input
                          id="middleName"
                          value={newEmployee.middleName}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              middleName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={newEmployee.lastName}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              lastName: e.target.value,
                            })
                          }
                          className={formErrors.lastName ? "border-destructive" : ""}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date of Birth *</Label>
                        <DateInput
                          value={newEmployee.dateOfBirth}
                          onChange={(date) =>
                            setNewEmployee({
                              ...newEmployee,
                              dateOfBirth: date,
                            })
                          }
                          placeholder="MM/DD/YY"
                          className={formErrors.dateOfBirth ? "border-destructive" : ""}
                          maxDate={new Date()}
                          minDate={new Date("1900-01-01")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender *</Label>
                        <Select
                          value={newEmployee.gender}
                          onValueChange={(value) =>
                            setNewEmployee({
                              ...newEmployee,
                              gender: value,
                            })
                          }
                        >
                          <SelectTrigger className={formErrors.gender ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border shadow-lg">
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maritalStatus">Marital Status *</Label>
                        <Select
                          value={newEmployee.maritalStatus}
                          onValueChange={(value) =>
                            setNewEmployee({
                              ...newEmployee,
                              maritalStatus: value,
                            })
                          }
                        >
                          <SelectTrigger className={formErrors.maritalStatus ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border shadow-lg">
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nationality *</Label>
                        <Select
                          onValueChange={(value) => setNewEmployee({ ...newEmployee, nationality: value })}
                          value={newEmployee.nationality}
                        >
                          <SelectTrigger className={formErrors.nationality ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {nationalities.map((nationality) => (
                              <SelectItem key={nationality} value={nationality}>
                                {nationality}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <Input
                          id="phoneNumber"
                          value={newEmployee.phoneNumber}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              phoneNumber: e.target.value,
                            })
                          }
                          placeholder="+234 XXX XXX XXXX"
                          className={formErrors.phoneNumber ? "border-destructive" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newEmployee.email}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              email: e.target.value,
                            })
                          }
                          placeholder="employee@company.com"
                          className={formErrors.email ? "border-destructive" : ""}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="homeAddress">Home Address *</Label>
                      <Textarea
                        id="homeAddress"
                        value={newEmployee.homeAddress}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            homeAddress: e.target.value,
                          })
                        }
                        placeholder="Full residential address"
                        className={formErrors.homeAddress ? "border-destructive" : ""}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                        <Input
                          id="emergencyContact"
                          value={newEmployee.emergencyContact}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              emergencyContact: e.target.value,
                            })
                          }
                          placeholder="Full name"
                          className={formErrors.emergencyContact ? "border-destructive" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactNumber">Emergency Contact Number *</Label>
                        <Input
                          id="emergencyContactNumber"
                          value={newEmployee.emergencyContactNumber}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              emergencyContactNumber: e.target.value,
                            })
                          }
                          placeholder="Phone number"
                          className={formErrors.emergencyContactNumber ? "border-destructive" : ""}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nextOfKinName">Next of Kin Name *</Label>
                        <Input
                          id="nextOfKinName"
                          value={newEmployee.nextOfKinName}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              nextOfKinName: e.target.value,
                            })
                          }
                          placeholder="Full name"
                          className={formErrors.nextOfKinName ? "border-destructive" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextOfKinRelationship">Next of Kin Relationship *</Label>
                        <Input
                          id="nextOfKinRelationship"
                          value={newEmployee.nextOfKinRelationship}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              nextOfKinRelationship: e.target.value,
                            })
                          }
                          placeholder="e.g., Spouse, Parent, Sibling"
                          className={formErrors.nextOfKinRelationship ? "border-destructive" : ""}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nextOfKinPhone">Next of Kin Phone Number *</Label>
                        <Input
                          id="nextOfKinPhone"
                          value={newEmployee.nextOfKinPhone}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              nextOfKinPhone: e.target.value,
                            })
                          }
                          placeholder="+234 XXX XXX XXXX"
                          className={formErrors.nextOfKinPhone ? "border-destructive" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextOfKinEmail">Next of Kin Email *</Label>
                        <Input
                          id="nextOfKinEmail"
                          type="email"
                          value={newEmployee.nextOfKinEmail}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              nextOfKinEmail: e.target.value,
                            })
                          }
                          placeholder="nextofkin@email.com"
                          className={formErrors.nextOfKinEmail ? "border-destructive" : ""}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nextOfKinAddress">Next of Kin Address *</Label>
                      <Textarea
                        id="nextOfKinAddress"
                        value={newEmployee.nextOfKinAddress}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            nextOfKinAddress: e.target.value,
                          })
                        }
                        placeholder="Full address of next of kin"
                        className={formErrors.nextOfKinAddress ? "border-destructive" : ""}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="job" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title *</Label>
                        <Input
                          id="jobTitle"
                          value={newEmployee.jobTitle}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              jobTitle: e.target.value,
                            })
                          }
                          className={formErrors.jobTitle ? "border-destructive" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department *</Label>
                        <Select
                          value={newEmployee.department}
                          onValueChange={(value) =>
                            setNewEmployee({
                              ...newEmployee,
                              department: value,
                            })
                          }
                        >
                          <SelectTrigger className={formErrors.department ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border shadow-lg">
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employmentType">Employment Type *</Label>
                        <Select
                          value={newEmployee.employmentType}
                          onValueChange={(value) =>
                            setNewEmployee({
                              ...newEmployee,
                              employmentType: value,
                            })
                          }
                        >
                          <SelectTrigger className={formErrors.employmentType ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border shadow-lg">
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Consultant">Consultant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gradeLevel">Grade Level *</Label>
                        <Select
                          value={newEmployee.gradeLevel}
                          onValueChange={(value) =>
                            setNewEmployee({
                              ...newEmployee,
                              gradeLevel: value,
                            })
                          }
                        >
                          <SelectTrigger className={formErrors.gradeLevel ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select grade level" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border shadow-lg">
                            {gradeLevels.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supervisorName">Supervisor Name *</Label>
                        <Input
                          id="supervisorName"
                          value={newEmployee.supervisorName}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              supervisorName: e.target.value,
                            })
                          }
                          className={formErrors.supervisorName ? "border-destructive" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workLocation">Work Location *</Label>
                        <Input
                          id="workLocation"
                          value={newEmployee.workLocation}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              workLocation: e.target.value,
                            })
                          }
                          placeholder="e.g., Lagos Office"
                          className={formErrors.workLocation ? "border-destructive" : ""}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Hire Date *</Label>
                        <DateInput
                          value={newEmployee.hireDate}
                          onChange={(date) =>
                            setNewEmployee({
                              ...newEmployee,
                              hireDate: date,
                            })
                          }
                          placeholder="MM/DD/YY"
                          className={formErrors.hireDate ? "border-destructive" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="probationPeriod">Probation Period *</Label>
                        <Select
                          value={newEmployee.probationPeriod}
                          onValueChange={(value) =>
                            setNewEmployee({
                              ...newEmployee,
                              probationPeriod: value,
                            })
                          }
                        >
                          <SelectTrigger className={formErrors.probationPeriod ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select probation period" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border shadow-lg">
                            <SelectItem value="1">1 month</SelectItem>
                            <SelectItem value="2">2 months</SelectItem>
                            <SelectItem value="3">3 months</SelectItem>
                            <SelectItem value="4">4 months</SelectItem>
                            <SelectItem value="5">5 months</SelectItem>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="7">7 months</SelectItem>
                            <SelectItem value="8">8 months</SelectItem>
                            <SelectItem value="9">9 months</SelectItem>
                            <SelectItem value="10">10 months</SelectItem>
                            <SelectItem value="11">11 months</SelectItem>
                            <SelectItem value="12">12 months (1 year)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Confirmation Date (Auto-calculated)</Label>
                        <Input
                          value={
                            newEmployee.confirmationDate
                              ? format(newEmployee.confirmationDate, "PPP")
                              : "Will be calculated based on hire date + probation period"
                          }
                          readOnly
                          className="bg-muted text-muted-foreground cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employmentStatus">Employment Status</Label>
                        <Select
                          value={newEmployee.employmentStatus}
                          onValueChange={(value) =>
                            setNewEmployee({
                              ...newEmployee,
                              employmentStatus: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border shadow-lg">
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="On-Leave">On-Leave</SelectItem>
                            <SelectItem value="Time-Off">Time-Off</SelectItem>
                            <SelectItem value="On-board">On-board</SelectItem>
                            <SelectItem value="Resigned">Resigned</SelectItem>
                            <SelectItem value="Terminated">Terminated</SelectItem>
                            <SelectItem value="Retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vacationDays">Vacation Days</Label>
                        <Select
                          value={newEmployee.vacationDays}
                          onValueChange={(value) =>
                            setNewEmployee({
                              ...newEmployee,
                              vacationDays: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vacation days" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border shadow-lg">
                            {Array.from(
                              {
                                length: 24,
                              },
                              (_, i) => i + 7,
                            ).map((days) => (
                              <SelectItem key={days} value={days.toString()}>
                                {days} days
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-4">
                    {newEmployee.employmentType === "Full-time" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="grossSalary">Gross Salary *</Label>
                          <Input
                            id="grossSalary"
                            type="number"
                            value={newEmployee.grossSalary}
                            onChange={(e) =>
                              setNewEmployee({
                                ...newEmployee,
                                grossSalary: e.target.value,
                              })
                            }
                            placeholder="2500000"
                          />
                          <p className="text-xs text-muted-foreground">Enter amount in Naira (₦).</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="basicSalary">Basic Salary (40% of Gross)</Label>
                          <Input
                            id="basicSalary"
                            type="number"
                            value={newEmployee.basicSalary}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                            placeholder="Auto-calculated"
                          />
                          <p className="text-xs text-muted-foreground">
                            Automatically calculated as 40% of gross salary.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="housingAllowance">Housing Allowance (20% of Gross)</Label>
                          <Input
                            id="housingAllowance"
                            type="number"
                            value={newEmployee.housingAllowance}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                            placeholder="Auto-calculated"
                          />
                          <p className="text-xs text-muted-foreground">
                            Automatically calculated as 20% of gross salary.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="transportAllowance">Transport Allowance (9% of Gross)</Label>
                          <Input
                            id="transportAllowance"
                            type="number"
                            value={newEmployee.transportAllowance}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                            placeholder="Auto-calculated"
                          />
                          <p className="text-xs text-muted-foreground">
                            Automatically calculated as 9% of gross salary.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="otherAllowance">Other Allowance (31% of Gross)</Label>
                          <Input
                            id="otherAllowance"
                            type="number"
                            value={newEmployee.otherAllowance}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                            placeholder="Auto-calculated"
                          />
                          <p className="text-xs text-muted-foreground">
                            Automatically calculated as 31% of gross salary.
                          </p>
                        </div>
                      </>
                    ) : newEmployee.employmentType === "Contract" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="grossSalary">Gross Salary *</Label>
                          <Input
                            id="grossSalary"
                            type="number"
                            value={newEmployee.grossSalary}
                            onChange={(e) =>
                              setNewEmployee({
                                ...newEmployee,
                                grossSalary: e.target.value,
                              })
                            }
                            placeholder="1500000"
                          />
                          <p className="text-xs text-muted-foreground">Enter gross salary amount in Naira (₦).</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Please select an employment type to configure financial information.</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-base font-medium">Bank Account for Salary Payments</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Select
                            value={newEmployee.bankName || ""}
                            onValueChange={(value) =>
                              setNewEmployee({
                                ...newEmployee,
                                bankName: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  newEmployee.nationality
                                    ? `Select ${newEmployee.nationality} bank`
                                    : "Select nationality first"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border shadow-lg">
                              {newEmployee.nationality === "Nigerian" && [
                                <SelectItem key="access" value="Access Bank">
                                  Access Bank
                                </SelectItem>,
                                <SelectItem key="gtb" value="Guaranty Trust Bank">
                                  Guaranty Trust Bank
                                </SelectItem>,
                                <SelectItem key="zenith" value="Zenith Bank">
                                  Zenith Bank
                                </SelectItem>,
                                <SelectItem key="uba" value="United Bank for Africa">
                                  United Bank for Africa
                                </SelectItem>,
                                <SelectItem key="firstbank" value="First Bank of Nigeria">
                                  First Bank of Nigeria
                                </SelectItem>,
                                <SelectItem key="fidelity" value="Fidelity Bank">
                                  Fidelity Bank
                                </SelectItem>,
                                <SelectItem key="union" value="Union Bank">
                                  Union Bank
                                </SelectItem>,
                                <SelectItem key="sterling" value="Sterling Bank">
                                  Sterling Bank
                                </SelectItem>,
                                <SelectItem key="fcmb" value="First City Monument Bank">
                                  First City Monument Bank
                                </SelectItem>,
                                <SelectItem key="ecobank" value="Ecobank">
                                  Ecobank
                                </SelectItem>,
                              ]}
                              {newEmployee.nationality === "American" && [
                                <SelectItem key="chase" value="JPMorgan Chase">
                                  JPMorgan Chase
                                </SelectItem>,
                                <SelectItem key="boa" value="Bank of America">
                                  Bank of America
                                </SelectItem>,
                                <SelectItem key="wells" value="Wells Fargo">
                                  Wells Fargo
                                </SelectItem>,
                                <SelectItem key="citi" value="Citibank">
                                  Citibank
                                </SelectItem>,
                                <SelectItem key="pnc" value="PNC Bank">
                                  PNC Bank
                                </SelectItem>,
                                <SelectItem key="capital" value="Capital One">
                                  Capital One
                                </SelectItem>,
                                <SelectItem key="td" value="TD Bank">
                                  TD Bank
                                </SelectItem>,
                                <SelectItem key="usbank" value="U.S. Bank">
                                  U.S. Bank
                                </SelectItem>,
                              ]}
                              {newEmployee.nationality === "British" && [
                                <SelectItem key="barclays" value="Barclays">
                                  Barclays
                                </SelectItem>,
                                <SelectItem key="lloyds" value="Lloyds Bank">
                                  Lloyds Bank
                                </SelectItem>,
                                <SelectItem key="hsbc" value="HSBC UK">
                                  HSBC UK
                                </SelectItem>,
                                <SelectItem key="natwest" value="NatWest">
                                  NatWest
                                </SelectItem>,
                                <SelectItem key="santander" value="Santander UK">
                                  Santander UK
                                </SelectItem>,
                                <SelectItem key="halifax" value="Halifax">
                                  Halifax
                                </SelectItem>,
                                <SelectItem key="nationwide" value="Nationwide">
                                  Nationwide
                                </SelectItem>,
                              ]}
                              {!["Nigerian", "American", "British"].includes(newEmployee.nationality) &&
                                newEmployee.nationality && [
                                  <SelectItem key="other" value="Other International Bank">
                                    Other International Bank
                                  </SelectItem>,
                                ]}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            value={newEmployee.accountNumber || ""}
                            onChange={(e) =>
                              setNewEmployee({
                                ...newEmployee,
                                accountNumber: e.target.value,
                              })
                            }
                            placeholder="Account number"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nuban">NUBAN</Label>
                          <Input
                            id="nuban"
                            value={newEmployee.nuban}
                            onChange={(e) =>
                              setNewEmployee({
                                ...newEmployee,
                                nuban: e.target.value,
                              })
                            }
                            placeholder="NUBAN code"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sortCode">Sort Code</Label>
                          <Input
                            id="sortCode"
                            value={newEmployee.sortCode}
                            onChange={(e) =>
                              setNewEmployee({
                                ...newEmployee,
                                sortCode: e.target.value,
                              })
                            }
                            placeholder="Bank sort code"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="government" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employeeId">Employee ID</Label>
                        <Input
                          id="employeeId"
                          value={newEmployee.employeeId}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              employeeId: e.target.value,
                            })
                          }
                          placeholder="Auto-generated if empty"
                          disabled={!!systemRole} // Disable when system role is selected
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationalId">National ID (NIN) *</Label>
                        <Input
                          id="nationalId"
                          value={newEmployee.nationalId}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              nationalId: e.target.value,
                            })
                          }
                          placeholder="11-digit NIN"
                          className={formErrors.nationalId ? "border-destructive" : ""}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passportNumber">Passport Number</Label>
                        <Input
                          id="passportNumber"
                          value={newEmployee.passportNumber}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              passportNumber: e.target.value,
                            })
                          }
                          placeholder="Passport Number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tin">TIN</Label>
                        <Input
                          id="tin"
                          value={newEmployee.tin}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              tin: e.target.value,
                            })
                          }
                          placeholder="Tax Identification Number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pensionPin">Pension PIN</Label>
                        <Input
                          id="pensionPin"
                          value={newEmployee.pensionPin}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              pensionPin: e.target.value,
                            })
                          }
                          placeholder="Pension Fund Administrator PIN"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nhfNumber">NHF Number</Label>
                        <Input
                          id="nhfNumber"
                          value={newEmployee.nhfNumber}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              nhfNumber: e.target.value,
                            })
                          }
                          placeholder="National Housing Fund Number"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={newEmployee.taxId}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            taxId: e.target.value,
                          })
                        }
                        placeholder="State Tax ID"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="additional" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyAssets">Company Asset Documents</Label>
                        <Input
                          id="companyAssets"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setNewEmployee({
                              ...newEmployee,
                              companyAssets: files,
                            });
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          Upload laptop agreements, asset submission forms, etc. (PDF, DOC, DOCX, JPG, PNG)
                        </p>
                      </div>
                      <h3 className="text-lg font-medium">Document Uploads</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ninDocument">NIN Document</Label>
                          <Input
                            id="ninDocument"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setNewEmployee({
                                ...newEmployee,
                                ninDocument: file,
                              });
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="passportPhoto">Passport Photo</Label>
                          <Input
                            id="passportPhoto"
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setNewEmployee({
                                ...newEmployee,
                                passportPhoto: file,
                              });
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cv">CV/Resume</Label>
                          <Input
                            id="cv"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setNewEmployee({
                                ...newEmployee,
                                cv: file,
                              });
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="educationCertificate">Certificate of Highest Educational Level</Label>
                          <Input
                            id="educationCertificate"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setNewEmployee({
                                ...newEmployee,
                                educationCertificate: file,
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="certifications">Professional Certifications</Label>
                        <Input
                          id="certifications"
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setNewEmployee({
                              ...newEmployee,
                              certifications: files,
                            });
                          }}
                        />
                        <p className="text-sm text-muted-foreground">Upload multiple certification documents</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="otherDocuments">Other Supporting Documents</Label>
                        <Input
                          id="otherDocuments"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setNewEmployee({
                              ...newEmployee,
                              otherDocuments: files,
                            });
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          Upload any other relevant documents (contracts, references, etc.)
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowAddEmployee(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddEmployee}>Add Employee</Button>
                  </div>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary">Employee Database</CardTitle>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Location" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg">
                    <SelectItem value="all">All Locations</SelectItem>
                    {uniqueLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg">
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterEmploymentType} onValueChange={setFilterEmploymentType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg">
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueEmploymentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="startDate" className="text-sm whitespace-nowrap">
                    Start Date From:
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile-responsive table wrapper */}
            <div className="overflow-x-auto -mx-3 md:mx-0">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Employee ID</TableHead>
                    <TableHead className="text-xs md:text-sm">Name</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs md:text-sm">Email</TableHead>
                    <TableHead className="hidden md:table-cell text-xs md:text-sm">Department</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs md:text-sm">Position</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs md:text-sm">Status</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs md:text-sm">Employment Type</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs md:text-sm">Vacation Days</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="text-muted-foreground">Loading employees...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No employees found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.employee_code || `EMP${employee.id?.toString().padStart(3, "0")}`}
                        </TableCell>
                        <TableCell>
                          {employee.first_name} {employee.last_name}
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.job_title}</TableCell>
                        <TableCell>
                          <Badge variant={employee.employment_status === "Active" ? "default" : "secondary"}>
                            {employee.employment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{employee.employment_type}</TableCell>
                        <TableCell>{employee.vacation_days || 0}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowViewDetails(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <RoleBasedComponent allowedRoles={["hr_manager", "corporate_hr"]}>
                                <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Employee
                                </DropdownMenuItem>
                                {employee.user_id && (
                                  <DropdownMenuItem onClick={() => handleResetPassword(employee)}>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Reset Password
                                  </DropdownMenuItem>
                                )}
                              </RoleBasedComponent>
                              <DropdownMenuItem onClick={() => handleDownloadProfile(employee)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleResignEmployee(employee)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Resign Employee
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Details Dialog */}
        <Dialog open={showViewDetails} onOpenChange={setShowViewDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
              <DialogDescription className="sr-only">Employee dialog</DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
                  <TabsTrigger value="personal" className="text-xs sm:text-sm">
                    Personal
                  </TabsTrigger>
                  <TabsTrigger value="job" className="text-xs sm:text-sm">
                    Job Info
                  </TabsTrigger>
                  <TabsTrigger value="financial" className="text-xs sm:text-sm">
                    Financial
                  </TabsTrigger>
                  <TabsTrigger value="government" className="text-xs sm:text-sm">
                    Gov IDs
                  </TabsTrigger>
                  <TabsTrigger value="additional" className="text-xs sm:text-sm">
                    Additional
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                      <p className="text-base font-medium">{selectedEmployee.first_name || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Middle Name</Label>
                      <p className="text-base">{selectedEmployee.middle_name || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                      <p className="text-base font-medium">{selectedEmployee.last_name || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                      <p className="text-base">
                        {selectedEmployee.dob ? format(new Date(selectedEmployee.dob), "PPP") : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                      <p className="text-base">{selectedEmployee.gender || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Marital Status</Label>
                      <p className="text-base">{selectedEmployee.marital_status || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Nationality</Label>
                      <p className="text-base">{selectedEmployee.nationality || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                      <p className="text-base">{selectedEmployee.phone_number || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                      <p className="text-base break-words">{selectedEmployee.email || "N/A"}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Home Address</Label>
                    <p className="text-base">{selectedEmployee.address || "N/A"}</p>
                  </div>
                </TabsContent>

                <TabsContent value="job" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                      <p className="text-base font-medium">
                        {selectedEmployee.employee_code || `EMP${selectedEmployee.id?.toString().padStart(3, "0")}`}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">System Role</Label>
                      <p className="text-base font-medium text-primary">
                        {selectedEmployee.user_role
                          ? ROLE_OPTIONS.find((opt) => opt.value === selectedEmployee.user_role)?.label ||
                            selectedEmployee.user_role
                          : "Not Assigned"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Job Title</Label>
                      <p className="text-base">{selectedEmployee.job_title || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                      <p className="text-base">{selectedEmployee.department || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Employment Type</Label>
                      <p className="text-base">{selectedEmployee.employment_type || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Employment Status</Label>
                      <p className="text-base">
                        <Badge variant={selectedEmployee.employment_status === "Active" ? "default" : "secondary"}>
                          {selectedEmployee.employment_status || "N/A"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Grade Level</Label>
                      <p className="text-base">{selectedEmployee.grade_level || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Supervisor Name</Label>
                      <p className="text-base">{selectedEmployee.supervisor_name || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Work Location</Label>
                      <p className="text-base">{selectedEmployee.work_location || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Hire Date</Label>
                      <p className="text-base">
                        {selectedEmployee.hire_date ? format(new Date(selectedEmployee.hire_date), "PPP") : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Probation Period</Label>
                      <p className="text-base">{selectedEmployee.probation_period || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Confirmation Date</Label>
                      <p className="text-base">
                        {selectedEmployee.confirmation_date
                          ? format(new Date(selectedEmployee.confirmation_date), "PPP")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Vacation Days</Label>
                      <p className="text-base">{selectedEmployee.vacation_days || 0}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Emergency Contact Name</Label>
                      <p className="text-base">{selectedEmployee.emergency_contact || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Emergency Contact Number</Label>
                      <p className="text-base">{selectedEmployee.emergency_contact_number || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Next of Kin Name</Label>
                      <p className="text-base">{selectedEmployee.next_of_kin_name || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Next of Kin Relationship</Label>
                      <p className="text-base">{selectedEmployee.next_of_kin_relationship || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Next of Kin Phone</Label>
                      <p className="text-base">{selectedEmployee.next_of_kin_phone || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Next of Kin Email</Label>
                      <p className="text-base">{selectedEmployee.next_of_kin_email || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Next of Kin Address</Label>
                      <p className="text-base">{selectedEmployee.next_of_kin_address || "N/A"}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Gross Salary</Label>
                    <p className="text-base font-semibold text-primary">
                      ₦{selectedEmployee.financial_details?.gross_salary?.toLocaleString() || "N/A"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Basic Salary</Label>
                      <p className="text-base">
                        ₦{selectedEmployee.financial_details?.basic_salary?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Meal Allowance</Label>
                      <p className="text-base">
                        ₦{selectedEmployee.financial_details?.meal_allowance?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Housing Allowance</Label>
                      <p className="text-base">
                        ₦{selectedEmployee.financial_details?.housing_allowance?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Transport Allowance</Label>
                      <p className="text-base">
                        ₦{selectedEmployee.financial_details?.transport_allowance?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Other Allowance</Label>
                      <p className="text-base">
                        ₦{selectedEmployee.financial_details?.other_allowance?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
                      <p className="text-base">{selectedEmployee.financial_details?.bank_name || "N/A"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                      <p className="text-base">{selectedEmployee.financial_details?.account_number || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">NUBAN</Label>
                      <p className="text-base">{selectedEmployee.financial_details?.nuban || "N/A"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Sort Code</Label>
                      <p className="text-base">{selectedEmployee.financial_details?.sort_code || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Bank Account</Label>
                      <p className="text-base">{selectedEmployee.financial_details?.bank_account || "N/A"}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="government" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">National ID</Label>
                      <p className="text-base">{selectedEmployee.national_id || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">BVN</Label>
                      <p className="text-base">{selectedEmployee.bvn || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">TIN</Label>
                      <p className="text-base">{selectedEmployee.tin || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Pension PIN</Label>
                      <p className="text-base">{selectedEmployee.pension_pin || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">NHF Number</Label>
                      <p className="text-base">{selectedEmployee.nhf_number || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Tax ID</Label>
                      <p className="text-base">{selectedEmployee.tax_id || "N/A"}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Performance History</Label>
                    <p className="text-base">{selectedEmployee.performance_history || "N/A"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Asset Allocation History</Label>
                    <p className="text-base">{selectedEmployee.asset_allocation_history || "N/A"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Supporting Documents</Label>
                    <p className="text-base">{selectedEmployee.supporting_documents || "N/A"}</p>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={showEditEmployee} onOpenChange={setShowEditEmployee}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription className="sr-only">Employee dialog</DialogDescription>
            </DialogHeader>

            {/* Add System Role Dropdown at the top */}
            <div className="space-y-2">
              <Label>System Role</Label>
              <Select
                value={editSystemRole}
                onValueChange={(val) => {
                  setEditSystemRole(val);
                  // Update employee code when system role changes
                  const newEmployeeCode = getNextEmployeeCode(val);
                  setEditEmployee((prev) => ({
                    ...prev,
                    employeeId: newEmployeeCode,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select system role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editEmployee && (
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
                  <TabsTrigger value="personal" className="text-xs sm:text-sm">
                    Personal
                  </TabsTrigger>
                  <TabsTrigger value="job" className="text-xs sm:text-sm">
                    Job Info
                  </TabsTrigger>
                  <TabsTrigger value="financial" className="text-xs sm:text-sm">
                    Financial
                  </TabsTrigger>
                  <TabsTrigger value="government" className="text-xs sm:text-sm">
                    Gov IDs
                  </TabsTrigger>
                  <TabsTrigger value="additional" className="text-xs sm:text-sm">
                    Additional
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editFirstName">First Name *</Label>
                      <Input
                        id="editFirstName"
                        value={editEmployee.firstName || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            firstName: e.target.value,
                          })
                        }
                        placeholder="First Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editMiddleName">Middle Name</Label>
                      <Input
                        id="editMiddleName"
                        value={editEmployee.middleName || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            middleName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editLastName">Last Name *</Label>
                      <Input
                        id="editLastName"
                        value={editEmployee.lastName || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            lastName: e.target.value,
                          })
                        }
                        placeholder="Last Name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <DateInput
                        value={editEmployee.dateOfBirth ? new Date(editEmployee.dateOfBirth) : undefined}
                        onChange={(date) =>
                          setEditEmployee({
                            ...editEmployee,
                            dateOfBirth: date ? date.toISOString().split("T")[0] : undefined,
                          })
                        }
                        placeholder="MM/DD/YY"
                        maxDate={new Date()}
                        minDate={new Date("1900-01-01")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editGender">Gender *</Label>
                      <Select
                        value={editEmployee.gender || ""}
                        onValueChange={(value) =>
                          setEditEmployee({
                            ...editEmployee,
                            gender: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg">
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="editMaritalStatus">Marital Status *</Label>
                      <Select
                        value={editEmployee.maritalStatus || ""}
                        onValueChange={(value) => setEditEmployee({ ...editEmployee, maritalStatus: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editNationality">Nationality *</Label>
                      <Select
                        value={editEmployee.nationality || ""}
                        onValueChange={(value) =>
                          setEditEmployee({
                            ...editEmployee,
                            nationality: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {nationalities.map((nationality) => (
                            <SelectItem key={nationality} value={nationality}>
                              {nationality}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="editPhoneNumber">Phone Number *</Label>
                      <Input
                        id="editPhoneNumber"
                        value={editEmployee.phoneNumber || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            phoneNumber: e.target.value,
                          })
                        }
                        placeholder="+234 XXX XXX XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editEmail">Email Address *</Label>
                      <Input
                        id="editEmail"
                        type="email"
                        value={editEmployee.email || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            email: e.target.value,
                          })
                        }
                        placeholder="employee@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editAddress">Home Address</Label>
                    <Textarea
                      id="editAddress"
                      value={editEmployee.homeAddress || ""}
                      onChange={(e) =>
                        setEditEmployee({
                          ...editEmployee,
                          homeAddress: e.target.value,
                        })
                      }
                      placeholder="Home Address"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="job" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editJobTitle">Job Title *</Label>
                      <Input
                        id="editJobTitle"
                        value={editEmployee.jobTitle || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            jobTitle: e.target.value,
                          })
                        }
                        placeholder="Job Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editDepartment">Department *</Label>
                      <Select
                        value={editEmployee.department || ""}
                        onValueChange={(value) =>
                          setEditEmployee({
                            ...editEmployee,
                            department: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editEmploymentType">Employment Type *</Label>
                      <Select
                        value={editEmployee.employment_type || ""}
                        onValueChange={(value) =>
                          setEditEmployee({
                            ...editEmployee,
                            employment_type: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Intern">Intern</SelectItem>
                          <SelectItem value="Consultant">Consultant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editGradeLevel">Grade Level</Label>
                      <Input
                        id="editGradeLevel"
                        value={editEmployee.grade_level || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            grade_level: e.target.value,
                          })
                        }
                        placeholder="e.g., Level 5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="editSupervisorName">Supervisor Name</Label>
                      <Input
                        id="editSupervisorName"
                        value={editEmployee.supervisor_name || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            supervisor_name: e.target.value,
                          })
                        }
                        placeholder="Supervisor's full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editWorkLocation">Work Location</Label>
                      <Input
                        id="editWorkLocation"
                        value={editEmployee.work_location || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            work_location: e.target.value,
                          })
                        }
                        placeholder="e.g., Lagos Office"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="editHireDate">Hire Date *</Label>
                      <DateInput
                        value={
                          editEmployee.hire_date
                            ? new Date(editEmployee.hire_date)
                            : editEmployee.joinDate
                              ? new Date(editEmployee.joinDate)
                              : undefined
                        }
                        onChange={(date) =>
                          setEditEmployee({
                            ...editEmployee,
                            hireDate: date,
                            joinDate: date ? format(date, "yyyy-MM-dd") : undefined,
                          })
                        }
                        placeholder="MM/DD/YY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editProbationPeriod">Probation Period</Label>
                      <Input
                        id="editProbationPeriod"
                        value={editEmployee.probationPeriod || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            probationPeriod: e.target.value,
                          })
                        }
                        placeholder="e.g., 3 months"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Confirmation Date</Label>
                      <DateInput
                        value={editEmployee.confirmationDate ? new Date(editEmployee.confirmationDate) : undefined}
                        onChange={(date) =>
                          setEditEmployee({
                            ...editEmployee,
                            confirmationDate: date,
                          })
                        }
                        placeholder="MM/DD/YY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editEmploymentStatus">Employment Status *</Label>
                      <Select
                        value={editEmployee.employment_status || ""}
                        onValueChange={(value) =>
                          setEditEmployee({
                            ...editEmployee,
                            employment_status: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="On Leave">On Leave</SelectItem>
                          <SelectItem value="Terminated">Terminated</SelectItem>
                          <SelectItem value="Resigned">Resigned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editVacationDays">Vacation Days</Label>
                    <Input
                      id="editVacationDays"
                      type="number"
                      value={editEmployee.vacationDays || ""}
                      onChange={(e) =>
                        setEditEmployee({
                          ...editEmployee,
                          vacationDays: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="25"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="editGrossSalary">Gross Salary (Monthly)</Label>
                      <Input
                        id="editGrossSalary"
                        type="number"
                        value={editEmployee.gross_salary || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            gross_salary: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="₦0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editNetSalary">Net Salary (Monthly)</Label>
                      <Input
                        id="editNetSalary"
                        type="number"
                        value={editEmployee.net_salary || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            net_salary: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="₦0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="editHousingAllowance">Housing Allowance</Label>
                      <Input
                        id="editHousingAllowance"
                        type="number"
                        value={editEmployee.housing_allowance || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            housing_allowance: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="₦0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editTransportAllowance">Transport Allowance</Label>
                      <Input
                        id="editTransportAllowance"
                        type="number"
                        value={editEmployee.transport_allowance || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            transport_allowance: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="₦0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="editMealAllowance">Meal Allowance</Label>
                      <Input
                        id="editMealAllowance"
                        type="number"
                        value={editEmployee.meal_allowance || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            meal_allowance: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="₦0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editOtherAllowance">Other Allowance</Label>
                      <Input
                        id="editOtherAllowance"
                        type="number"
                        value={editEmployee.other_allowance || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            other_allowance: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="₦0.00"
                      />
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <h3 className="text-base font-medium">Bank Account Information</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="editFinancialBankName">Bank Name</Label>
                      <Input
                        id="editFinancialBankName"
                        value={editEmployee.bank_name || editEmployee.bankName || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            bank_name: e.target.value,
                            bankName: e.target.value,
                          })
                        }
                        placeholder="Bank name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editFinancialAccountNumber">Account Number</Label>
                      <Input
                        id="editFinancialAccountNumber"
                        value={editEmployee.account_number || editEmployee.accountNumber || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            account_number: e.target.value,
                            accountNumber: e.target.value,
                          })
                        }
                        placeholder="Account number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="editFinancialNuban">NUBAN</Label>
                      <Input
                        id="editFinancialNuban"
                        value={editEmployee.nuban || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            nuban: e.target.value,
                          })
                        }
                        placeholder="NUBAN code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editFinancialSortCode">Sort Code</Label>
                      <Input
                        id="editFinancialSortCode"
                        value={editEmployee.sort_code || editEmployee.sortCode || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            sort_code: e.target.value,
                            sortCode: e.target.value,
                          })
                        }
                        placeholder="Sort code"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="government" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editEmployeeId">Employee ID</Label>
                      <Input
                        id="editEmployeeId"
                        value={editEmployee.id || editEmployee.employeeId || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            id: e.target.value,
                            employeeId: e.target.value,
                          })
                        }
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editNationalId">National ID (NIN)</Label>
                      <Input
                        id="editNationalId"
                        value={editEmployee.nationalId || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            nationalId: e.target.value,
                          })
                        }
                        placeholder="National ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editPassportNumber">Passport Number</Label>
                      <Input
                        id="editPassportNumber"
                        value={editEmployee.passportNumber || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            passportNumber: e.target.value,
                          })
                        }
                        placeholder="Passport number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editTin">TIN</Label>
                      <Input
                        id="editTin"
                        value={editEmployee.tin || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            tin: e.target.value,
                          })
                        }
                        placeholder="TIN"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editPensionPin">Pension PIN</Label>
                      <Input
                        id="editPensionPin"
                        value={editEmployee.pensionPin || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            pensionPin: e.target.value,
                          })
                        }
                        placeholder="Pension PIN"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editNhfNumber">NHF Number</Label>
                      <Input
                        id="editNhfNumber"
                        value={editEmployee.nhfNumber || ""}
                        onChange={(e) =>
                          setEditEmployee({
                            ...editEmployee,
                            nhfNumber: e.target.value,
                          })
                        }
                        placeholder="NHF Number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editTaxId">Tax ID</Label>
                    <Input
                      id="editTaxId"
                      value={editEmployee.taxId || ""}
                      onChange={(e) =>
                        setEditEmployee({
                          ...editEmployee,
                          taxId: e.target.value,
                        })
                      }
                      placeholder="Tax ID"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Additional Information</Label>
                    <p className="text-sm text-muted-foreground">
                      Extended employee information can be added here in future updates.
                    </p>
                  </div>
                </TabsContent>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditEmployee(false);
                      setEditSystemRole(""); // Reset edit system role
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateEmployee}>Update Employee</Button>
                </div>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Employee Credentials Modal */}
        <EmployeeCredentialsModal
          isOpen={showCredentialsModal}
          credentials={newEmployeeCredentials}
          employeeName={newEmployeeName}
          onClose={() => {
            setShowCredentialsModal(false);
            setNewEmployeeCredentials(null);
            setNewEmployeeName("");
          }}
        />

        {/* CSV Validation Preview */}
        <CSVValidationPreview
          isOpen={showValidationPreview}
          onClose={() => {
            setShowValidationPreview(false);
            setValidationResult(null);
          }}
          onConfirmImport={handleConfirmImport}
          validationResult={validationResult}
          fileName={importFileName}
        />
      </div>
    </ProtectedRoute>
  );
}
