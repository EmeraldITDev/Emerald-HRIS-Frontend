import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Download, Upload, Edit, Eye, MoreHorizontal, CalendarIcon, FileText, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { parseCSVFile, formatDataForPHP, type EmployeeData } from "@/utils/csvImport";
import { downloadCSVTemplate } from "@/utils/csvTemplate";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Sample employee data with updated fields
const employees = [{
  id: "EMP001",
  firstName: "Adebayo",
  lastName: "Johnson",
  email: "adebayo.johnson@company.com",
  department: "Engineering",
  position: "Senior Software Engineer",
  salary: "₦2,500,000",
  status: "Active",
  joinDate: "2022-03-15",
  phone: "+234 803 123 4567",
  vacationDays: 25,
  employmentType: "FTE"
}, {
  id: "EMP002",
  firstName: "Fatima",
  lastName: "Abdul",
  email: "fatima.abdul@company.com",
  department: "Accounting",
  position: "HR Manager",
  salary: "₦1,800,000",
  status: "Active",
  joinDate: "2021-08-20",
  phone: "+234 807 654 3210",
  vacationDays: 30,
  employmentType: "FTE"
}, {
  id: "EMP003",
  firstName: "Chinedu",
  lastName: "Okafor",
  email: "chinedu.okafor@company.com",
  department: "Supply Chain",
  position: "Financial Analyst",
  salary: "₦1,200,000",
  status: "On Leave",
  joinDate: "2023-01-10",
  phone: "+234 815 987 6543",
  vacationDays: 20,
  employmentType: "Consultant"
}, {
  id: "EMP004",
  firstName: "Kemi",
  lastName: "Adeleke",
  email: "kemi.adeleke@company.com",
  department: "Marketing",
  position: "Marketing Specialist",
  salary: "₦950,000",
  status: "Active",
  joinDate: "2023-06-05",
  phone: "+234 809 246 8135",
  vacationDays: 25,
  employmentType: "FTE"
}];
export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeList, setEmployeeList] = useState<EmployeeData[]>(employees);
  const [filterLocation, setFilterLocation] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("")
  const [filterEmploymentType, setFilterEmploymentType] = useState("")
  const [filterStartDate, setFilterStartDate] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    toast
  } = useToast();
  const [formErrors, setFormErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const [currentTab, setCurrentTab] = useState("personal");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [editEmployee, setEditEmployee] = useState<any>(null);
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
    lastCompanyAsset: null as File | null
  });
  const departments = ["Executive", "Business Development", "Technical Operations", "Operations", "Legal", "Supply Chain", "Finance", "Human Resource", "IT"];
  const gradeLevels = ["Junior", "Middle", "Senior", "Executive"];
  
  const nationalities = [
    "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentinian", "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe", "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican", "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinea-Bissauan", "Guinean", "Guyanese", "Haitian", "Herzegovinian", "Honduran", "Hungarian", "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani", "Kenyan", "Kittian and Nevisian", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivan", "Malian", "Maltese", "Marshallese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian", "Moroccan", "Mosotho", "Motswana", "Mozambican", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Ni-Vanuatu", "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "Norwegian", "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan", "San Marinese", "Sao Tomean", "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovakian", "Slovenian", "Solomon Islander", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamer", "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian or Tobagonian", "Tunisian", "Turkish", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbekistani", "Venezuelan", "Vietnamese", "Welsh", "Yemenite", "Zambian", "Zimbabwean"
  ];

  // Check if Add Employee dialog should open on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('add') === 'true') {
      setShowAddEmployee(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  const filteredEmployees = employeeList.filter(employee => {
    const matchesSearch = `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
      employee.department.toLowerCase().includes(searchTerm.toLowerCase()) || 
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLocation = !filterLocation || filterLocation === "all" || (employee.workLocation && employee.workLocation === filterLocation)
    const matchesDepartment = !filterDepartment || filterDepartment === "all" || employee.department === filterDepartment
    const matchesEmploymentType = !filterEmploymentType || filterEmploymentType === "all" || employee.employmentType === filterEmploymentType
    const matchesStartDate = !filterStartDate || (employee.joinDate && employee.joinDate >= filterStartDate)
    
    return matchesSearch && matchesLocation && matchesDepartment && matchesEmploymentType && matchesStartDate
  })

  // Get unique values for filter dropdowns
  const uniqueLocations = [...new Set(employeeList.map(emp => emp.workLocation))].filter(Boolean)
  const uniqueDepartments = [...new Set(employeeList.map(emp => emp.department))].filter(Boolean)
  const uniqueEmploymentTypes = [...new Set(employeeList.map(emp => emp.employmentType))].filter(Boolean)

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
      setNewEmployee(prev => ({
        ...prev,
        confirmationDate
      }));
    }
  }, [newEmployee.hireDate, newEmployee.probationPeriod]);

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
          variant: "destructive"
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
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }
    try {
      const result = await parseCSVFile(file, employeeList);
      if (result.success && result.data.length > 0) {
        // Add imported employees to the list
        setEmployeeList(prev => [...prev, ...result.data]);

        // For future PHP integration, log the formatted data
        const phpData = formatDataForPHP(result.data);
        console.log('Data formatted for PHP backend:', phpData);
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.data.length} employees`
        });
      } else if (result.errors.length > 0) {
        toast({
          title: "Import Failed",
          description: result.errors.join(', '),
          variant: "destructive"
        });
      } else {
        toast({
          title: "No Data Found",
          description: "No valid employee data found in the CSV file",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('CSV Import Error:', error);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "An error occurred while importing the CSV file. Please check the file format and try again.",
        variant: "destructive"
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const handleAddEmployee = () => {
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
        variant: "destructive"
      });
      return;
    }
    const empId = newEmployee.employeeId || `EMP${String(employeeList.length + 1).padStart(3, '0')}`;
    const employee = {
      id: empId,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      email: newEmployee.email,
      department: newEmployee.department,
      position: newEmployee.jobTitle,
      salary: newEmployee.grossSalary ? `₦${newEmployee.grossSalary}` : "₦0",
      status: newEmployee.employmentStatus,
      joinDate: newEmployee.hireDate ? format(newEmployee.hireDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
      phone: newEmployee.phoneNumber,
      vacationDays: parseInt(newEmployee.vacationDays) || 20,
      employmentType: newEmployee.employmentType
    };

    // Add the additional fields to the employee object
    const fullEmployee = {
      ...employee,
      ...newEmployee
    };
    setEmployeeList(prev => [...prev, fullEmployee as any]);
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
      employeeId: "",
      nationalId: "",
      passportNumber: "",
      tin: "",
      pensionPin: "",
      nhfNumber: "",
      taxId: "",
      vacationDays: "",
      ninDocument: null,
      passportPhoto: null,
      certifications: [],
      cv: null,
      educationCertificate: null,
      otherDocuments: [],
      companyAssets: [],
      lastCompanyAsset: null
    });
    setFormErrors({});
    setCurrentTab("personal");
    setShowAddEmployee(false);
    toast({
      title: "Employee Added",
      description: `${newEmployee.firstName} ${newEmployee.lastName} has been successfully added to the system.`
    });
  };
  const handleViewDetails = (employee: any) => {
    setSelectedEmployee(employee);
    setShowViewDetails(true);
  };
  const handleEditEmployee = (employee: any) => {
    setEditEmployee({
      ...employee
    });
    setShowEditEmployee(true);
  };
  const handleUpdateEmployee = () => {
    setEmployeeList(prev => prev.map(emp => emp.id === editEmployee.id ? editEmployee : emp));
    setShowEditEmployee(false);
    setEditEmployee(null);
    toast({
      title: "Employee Updated",
      description: `${editEmployee.firstName} ${editEmployee.lastName}'s information has been updated.`
    });
  };
  const handleDeleteEmployee = (employee: any) => {
    setEmployeeList(prev => prev.filter(emp => emp.id !== employee.id));
    toast({
      title: "Employee Deleted",
      description: `${employee.firstName} ${employee.lastName} has been removed from the system.`
    });
  };
  const handleDownloadProfile = (employee: any) => {
    const pdf = new jsPDF();

    // Title
    pdf.setFontSize(20);
    pdf.text('Employee Profile', 20, 30);

    // Employee basic info
    pdf.setFontSize(12);
    pdf.text(`Name: ${employee.firstName} ${employee.lastName}`, 20, 50);
    pdf.text(`Employee ID: ${employee.id}`, 20, 60);
    pdf.text(`Email: ${employee.email}`, 20, 70);
    pdf.text(`Phone: ${employee.phone || employee.phoneNumber || 'N/A'}`, 20, 80);
    pdf.text(`Department: ${employee.department}`, 20, 90);
    pdf.text(`Position: ${employee.position || employee.jobTitle}`, 20, 100);
    pdf.text(`Employment Type: ${employee.employmentType}`, 20, 110);
    pdf.text(`Status: ${employee.status || employee.employmentStatus}`, 20, 120);
    pdf.text(`Hire Date: ${employee.joinDate || employee.hireDate || 'N/A'}`, 20, 130);

    // Financial info
    pdf.text(`Salary: ${employee.salary || employee.grossSalary || 'N/A'}`, 20, 150);
    if (employee.housingAllowance) pdf.text(`Housing Allowance: ${employee.housingAllowance}`, 20, 160);
    if (employee.transportAllowance) pdf.text(`Transport Allowance: ${employee.transportAllowance}`, 20, 170);
    if (employee.otherAllowance) pdf.text(`Other Allowance: ${employee.otherAllowance}`, 20, 180);
    pdf.save(`${employee.firstName}_${employee.lastName}_profile.pdf`);
    toast({
      title: "Profile Downloaded",
      description: `${employee.firstName} ${employee.lastName}'s profile has been downloaded as PDF.`
    });
  };
  const handleExportData = () => {
    const exportData = employeeList.map((emp: any) => ({
      // Personal Information
      'Employee ID': emp.id || emp.employeeId || '',
      'First Name': emp.firstName || '',
      'Middle Name': emp.middleName || '',
      'Last Name': emp.lastName || '',
      'Date of Birth': emp.dateOfBirth ? format(new Date(emp.dateOfBirth), 'yyyy-MM-dd') : '',
      'Gender': emp.gender || '',
      'Marital Status': emp.maritalStatus || '',
      'Nationality': emp.nationality || '',
      'Phone Number': emp.phone || emp.phoneNumber || '',
      'Email': emp.email || '',
      'Home Address': emp.homeAddress || '',
      'Emergency Contact Name': emp.emergencyContact || '',
      'Emergency Contact Number': emp.emergencyContactNumber || '',
      'Next of Kin Name': emp.nextOfKinName || '',
      'Next of Kin Relationship': emp.nextOfKinRelationship || '',
      'Next of Kin Phone': emp.nextOfKinPhone || '',
      'Next of Kin Address': emp.nextOfKinAddress || '',
      'Next of Kin Email': emp.nextOfKinEmail || '',
      
      // Job Information  
      'Job Title': emp.position || emp.jobTitle || '',
      'Department': emp.department || '',
      'Employment Type': emp.employmentType || '',
      'Grade Level': emp.gradeLevel || '',
      'Supervisor Name': emp.supervisorName || '',
      'Work Location': emp.workLocation || '',
      'Hire Date': emp.joinDate || emp.hireDate || '',
      'Probation Period': emp.probationPeriod || '',
      'Confirmation Date': emp.confirmationDate ? format(new Date(emp.confirmationDate), 'yyyy-MM-dd') : '',
      'Employment Status': emp.status || emp.employmentStatus || '',
      
      // Financial Information
      'Gross Salary': emp.salary || emp.grossSalary || '',
      'Basic Salary': emp.basicSalary || '',
      'Housing Allowance': emp.housingAllowance || '',
      'Transport Allowance': emp.transportAllowance || '',
      'Other Allowances': emp.otherAllowance || '',
      'Bank Account': emp.bankAccount || '',
      
      // Banking Information
      'Bank Name': emp.bankName || '',
      'Account Number': emp.accountNumber || '',
      'NUBAN': emp.nuban || '',
      'Sort Code': emp.sortCode || '',
      
      // Government IDs
      'National ID': emp.nationalId || '',
      'Passport Number': emp.passportNumber || '',
      'TIN': emp.tin || '',
      'Pension PIN': emp.pensionPin || '',
      'NHF Number': emp.nhfNumber || '',
      'Tax ID': emp.taxId || '',
      
      // Additional Fields
      'Vacation Days': emp.vacationDays || 0
      // Note: Excluding additional documents as requested
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    XLSX.writeFile(workbook, 'employees_export.xlsx');
    toast({
      title: "Data Exported",
      description: "Employee data has been exported to Excel file (excluding additional documents)."
    });
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">Active</Badge>;
      case "On-Leave":
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs whitespace-nowrap shrink-0">On-Leave</Badge>;
      case "Time-Off":
        return <Badge className="bg-info/10 text-info border-info/20 text-xs whitespace-nowrap shrink-0">Time-Off</Badge>;
      case "On-board":
        return <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">On-board</Badge>;
      case "On Leave":
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs whitespace-nowrap shrink-0">On Leave</Badge>;
      case "Terminated":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Terminated</Badge>;
      case "Resigned":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs">Resigned</Badge>;
      case "Inactive":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Inactive</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };
  return <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Employee Records</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage comprehensive employee information and records
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={downloadCSVTemplate}>
            <FileText className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Download Template
          </Button>
          <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={handleImportCSV}>
            <Upload className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Import CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{
          display: 'none'
        }} />
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
              </DialogHeader>
              <Tabs value={currentTab} onValueChange={tab => {
              if (canProceedToTab(tab)) {
                setCurrentTab(tab);
              }
            }} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
                  <TabsTrigger value="personal" className="text-xs sm:text-sm">Personal</TabsTrigger>
                  <TabsTrigger value="job" className="text-xs sm:text-sm">Job Info</TabsTrigger>
                  <TabsTrigger value="financial" className="text-xs sm:text-sm">Financial</TabsTrigger>
                  <TabsTrigger value="government" className="text-xs sm:text-sm">Gov IDs</TabsTrigger>
                  <TabsTrigger value="additional" className="text-xs sm:text-sm">Additional</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" value={newEmployee.firstName} onChange={e => setNewEmployee({
                      ...newEmployee,
                      firstName: e.target.value
                    })} className={formErrors.firstName ? "border-destructive" : ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input id="middleName" value={newEmployee.middleName} onChange={e => setNewEmployee({
                      ...newEmployee,
                      middleName: e.target.value
                    })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" value={newEmployee.lastName} onChange={e => setNewEmployee({
                      ...newEmployee,
                      lastName: e.target.value
                    })} className={formErrors.lastName ? "border-destructive" : ""} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date of Birth *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newEmployee.dateOfBirth && "text-muted-foreground", formErrors.dateOfBirth ? "border-destructive" : "")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newEmployee.dateOfBirth ? format(newEmployee.dateOfBirth, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b">
                            <div className="flex items-center gap-2">
                              <Select 
                                value={newEmployee.dateOfBirth ? newEmployee.dateOfBirth.getFullYear().toString() : ""} 
                                onValueChange={(year) => {
                                  const currentDate = newEmployee.dateOfBirth || new Date();
                                  const newDate = new Date(parseInt(year), currentDate.getMonth(), currentDate.getDate());
                                  setNewEmployee({
                                    ...newEmployee,
                                    dateOfBirth: newDate
                                  });
                                }}
                              >
                                <SelectTrigger className="w-20 h-8">
                                  <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border shadow-lg max-h-48">
                                  {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select 
                                value={newEmployee.dateOfBirth ? newEmployee.dateOfBirth.getMonth().toString() : ""} 
                                onValueChange={(month) => {
                                  const currentDate = newEmployee.dateOfBirth || new Date();
                                  const newDate = new Date(currentDate.getFullYear(), parseInt(month), currentDate.getDate());
                                  setNewEmployee({
                                    ...newEmployee,
                                    dateOfBirth: newDate
                                  });
                                }}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border shadow-lg">
                                  {[
                                    "January", "February", "March", "April", "May", "June",
                                    "July", "August", "September", "October", "November", "December"
                                  ].map((month, index) => (
                                    <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Calendar 
                            mode="single" 
                            selected={newEmployee.dateOfBirth} 
                            onSelect={date => setNewEmployee({
                              ...newEmployee,
                              dateOfBirth: date
                            })} 
                            initialFocus 
                            className="p-3 pointer-events-auto" 
                            month={newEmployee.dateOfBirth}
                            onMonthChange={(month) => {
                              setNewEmployee({
                                ...newEmployee,
                                dateOfBirth: month
                              });
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={newEmployee.gender} onValueChange={value => setNewEmployee({
                      ...newEmployee,
                      gender: value
                    })}>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">Marital Status *</Label>
                      <Select value={newEmployee.maritalStatus} onValueChange={value => setNewEmployee({
                      ...newEmployee,
                      maritalStatus: value
                    })}>
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
                      <Select onValueChange={(value) => setNewEmployee({ ...newEmployee, nationality: value })} value={newEmployee.nationality}>
                        <SelectTrigger className={formErrors.nationality ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {nationalities.map((nationality) => (
                            <SelectItem key={nationality} value={nationality}>{nationality}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input id="phoneNumber" value={newEmployee.phoneNumber} onChange={e => setNewEmployee({
                      ...newEmployee,
                      phoneNumber: e.target.value
                    })} placeholder="+234 XXX XXX XXXX" className={formErrors.phoneNumber ? "border-destructive" : ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" value={newEmployee.email} onChange={e => setNewEmployee({
                      ...newEmployee,
                      email: e.target.value
                    })} placeholder="employee@company.com" className={formErrors.email ? "border-destructive" : ""} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="homeAddress">Home Address *</Label>
                    <Textarea id="homeAddress" value={newEmployee.homeAddress} onChange={e => setNewEmployee({
                    ...newEmployee,
                    homeAddress: e.target.value
                  })} placeholder="Full residential address" className={formErrors.homeAddress ? "border-destructive" : ""} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                      <Input id="emergencyContact" value={newEmployee.emergencyContact} onChange={e => setNewEmployee({
                      ...newEmployee,
                      emergencyContact: e.target.value
                    })} placeholder="Full name" className={formErrors.emergencyContact ? "border-destructive" : ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactNumber">Emergency Contact Number *</Label>
                      <Input id="emergencyContactNumber" value={newEmployee.emergencyContactNumber} onChange={e => setNewEmployee({
                      ...newEmployee,
                      emergencyContactNumber: e.target.value
                    })} placeholder="Phone number" className={formErrors.emergencyContactNumber ? "border-destructive" : ""} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nextOfKinName">Next of Kin Name *</Label>
                      <Input id="nextOfKinName" value={newEmployee.nextOfKinName} onChange={e => setNewEmployee({
                      ...newEmployee,
                      nextOfKinName: e.target.value
                    })} placeholder="Full name" className={formErrors.nextOfKinName ? "border-destructive" : ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nextOfKinRelationship">Next of Kin Relationship *</Label>
                      <Input id="nextOfKinRelationship" value={newEmployee.nextOfKinRelationship} onChange={e => setNewEmployee({
                      ...newEmployee,
                      nextOfKinRelationship: e.target.value
                    })} placeholder="e.g., Spouse, Parent, Sibling" className={formErrors.nextOfKinRelationship ? "border-destructive" : ""} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nextOfKinPhone">Next of Kin Phone Number *</Label>
                      <Input id="nextOfKinPhone" value={newEmployee.nextOfKinPhone} onChange={e => setNewEmployee({
                      ...newEmployee,
                      nextOfKinPhone: e.target.value
                    })} placeholder="+234 XXX XXX XXXX" className={formErrors.nextOfKinPhone ? "border-destructive" : ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nextOfKinEmail">Next of Kin Email *</Label>
                      <Input id="nextOfKinEmail" type="email" value={newEmployee.nextOfKinEmail} onChange={e => setNewEmployee({
                      ...newEmployee,
                      nextOfKinEmail: e.target.value
                    })} placeholder="nextofkin@email.com" className={formErrors.nextOfKinEmail ? "border-destructive" : ""} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinAddress">Next of Kin Address *</Label>
                    <Textarea id="nextOfKinAddress" value={newEmployee.nextOfKinAddress} onChange={e => setNewEmployee({
                    ...newEmployee,
                    nextOfKinAddress: e.target.value
                  })} placeholder="Full address of next of kin" className={formErrors.nextOfKinAddress ? "border-destructive" : ""} />
                  </div>
                </TabsContent>

                <TabsContent value="job" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title *</Label>
                      <Input id="jobTitle" value={newEmployee.jobTitle} onChange={e => setNewEmployee({
                      ...newEmployee,
                      jobTitle: e.target.value
                    })} className={formErrors.jobTitle ? "border-destructive" : ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select value={newEmployee.department} onValueChange={value => setNewEmployee({
                      ...newEmployee,
                      department: value
                    })}>
                        <SelectTrigger className={formErrors.department ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg">
                          {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employmentType">Employment Type *</Label>
                      <Select value={newEmployee.employmentType} onValueChange={value => setNewEmployee({
                      ...newEmployee,
                      employmentType: value
                    })}>
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
                      <Select value={newEmployee.gradeLevel} onValueChange={value => setNewEmployee({
                      ...newEmployee,
                      gradeLevel: value
                    })}>
                        <SelectTrigger className={formErrors.gradeLevel ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg">
                          {gradeLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supervisorName">Supervisor Name *</Label>
                      <Input id="supervisorName" value={newEmployee.supervisorName} onChange={e => setNewEmployee({
                      ...newEmployee,
                      supervisorName: e.target.value
                    })} className={formErrors.supervisorName ? "border-destructive" : ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workLocation">Work Location *</Label>
                      <Input id="workLocation" value={newEmployee.workLocation} onChange={e => setNewEmployee({
                      ...newEmployee,
                      workLocation: e.target.value
                    })} placeholder="e.g., Lagos Office" className={formErrors.workLocation ? "border-destructive" : ""} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Hire Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newEmployee.hireDate && "text-muted-foreground", formErrors.hireDate ? "border-destructive" : "")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newEmployee.hireDate ? format(newEmployee.hireDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={newEmployee.hireDate} onSelect={date => setNewEmployee({
                          ...newEmployee,
                          hireDate: date
                        })} initialFocus className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="probationPeriod">Probation Period *</Label>
                      <Select value={newEmployee.probationPeriod} onValueChange={value => setNewEmployee({
                        ...newEmployee,
                        probationPeriod: value
                      })}>
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
                        value={newEmployee.confirmationDate ? format(newEmployee.confirmationDate, "PPP") : "Will be calculated based on hire date + probation period"} 
                        readOnly 
                        className="bg-muted text-muted-foreground cursor-not-allowed" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employmentStatus">Employment Status</Label>
                      <Select value={newEmployee.employmentStatus} onValueChange={value => setNewEmployee({
                      ...newEmployee,
                      employmentStatus: value
                    })}>
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
                      <Select value={newEmployee.vacationDays} onValueChange={value => setNewEmployee({
                      ...newEmployee,
                      vacationDays: value
                    })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vacation days" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg">
                          {Array.from({
                          length: 24
                        }, (_, i) => i + 7).map(days => <SelectItem key={days} value={days.toString()}>{days} days</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  {newEmployee.employmentType === "Full-time" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="grossSalary">Gross Pay *</Label>
                        <Input id="grossSalary" type="number" value={newEmployee.grossSalary} onChange={e => {
                        const grossPay = parseFloat(e.target.value) || 0;
                        const housing = Math.round(grossPay * 0.20);
                        const basic = Math.round(grossPay * 0.40);
                        const transport = Math.round(grossPay * 0.09);
                        const other = Math.round(grossPay * 0.31);
                        setNewEmployee({
                          ...newEmployee,
                          grossSalary: e.target.value,
                          housingAllowance: housing.toString(),
                          basicSalary: basic.toString(),
                          transportAllowance: transport.toString(),
                          otherAllowance: other.toString()
                        });
                      }} placeholder="2500000" />
                        <p className="text-xs text-muted-foreground">Enter amount in Naira (₦). All allowances will be auto-calculated.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="housingAllowance">Housing Allowance (20%)</Label>
                          <Input id="housingAllowance" value={newEmployee.housingAllowance ? `₦${parseInt(newEmployee.housingAllowance).toLocaleString()}` : "₦0"} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="basicSalary">Basic Salary (40%)</Label>
                          <Input id="basicSalary" value={newEmployee.basicSalary ? `₦${parseInt(newEmployee.basicSalary).toLocaleString()}` : "₦0"} readOnly className="bg-muted" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="transportAllowance">Transport Allowance (9%)</Label>
                          <Input id="transportAllowance" value={newEmployee.transportAllowance ? `₦${parseInt(newEmployee.transportAllowance).toLocaleString()}` : "₦0"} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="otherAllowance">Other Allowances (31%)</Label>
                          <Input id="otherAllowance" value={newEmployee.otherAllowance ? `₦${parseInt(newEmployee.otherAllowance).toLocaleString()}` : "₦0"} readOnly className="bg-muted" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="contractAmount">Contract Amount *</Label>
                        <Input 
                          id="contractAmount" 
                          type="number" 
                          value={newEmployee.contractAmount || ""} 
                          onChange={e => setNewEmployee({
                            ...newEmployee,
                            contractAmount: e.target.value
                          })} 
                          placeholder="5000000" 
                        />
                        <p className="text-xs text-muted-foreground">Enter total contract amount in Naira (₦).</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentFrequency">Payment Frequency *</Label>
                          <Select 
                            value={newEmployee.paymentFrequency || ""} 
                            onValueChange={value => setNewEmployee({
                              ...newEmployee,
                              paymentFrequency: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border shadow-lg">
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                              <SelectItem value="Project-based">Project-based</SelectItem>
                              <SelectItem value="Milestone">Milestone</SelectItem>
                              <SelectItem value="One-time">One-time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contractDuration">Contract Duration</Label>
                          <Select 
                            value={newEmployee.contractDuration || ""} 
                            onValueChange={value => setNewEmployee({
                              ...newEmployee,
                              contractDuration: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border shadow-lg">
                              <SelectItem value="1-month">1 Month</SelectItem>
                              <SelectItem value="3-months">3 Months</SelectItem>
                              <SelectItem value="6-months">6 Months</SelectItem>
                              <SelectItem value="1-year">1 Year</SelectItem>
                              <SelectItem value="2-years">2 Years</SelectItem>
                              <SelectItem value="Ongoing">Ongoing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contractTerms">Contract Terms</Label>
                        <Textarea 
                          id="contractTerms" 
                          value={newEmployee.contractTerms || ""} 
                          onChange={e => setNewEmployee({
                            ...newEmployee,
                            contractTerms: e.target.value
                          })} 
                          placeholder="Additional contract terms and conditions..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Bank Account for Salary Payments</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Select value={newEmployee.bankName || ""} onValueChange={value => setNewEmployee({
                        ...newEmployee,
                        bankName: value
                      })}>
                          <SelectTrigger>
                            <SelectValue placeholder={newEmployee.nationality ? `Select ${newEmployee.nationality} bank` : "Select nationality first"} />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border shadow-lg">
                            {newEmployee.nationality === "Nigerian" && [<SelectItem key="access" value="Access Bank">Access Bank</SelectItem>, <SelectItem key="gtb" value="Guaranty Trust Bank">Guaranty Trust Bank</SelectItem>, <SelectItem key="zenith" value="Zenith Bank">Zenith Bank</SelectItem>, <SelectItem key="uba" value="United Bank for Africa">United Bank for Africa</SelectItem>, <SelectItem key="firstbank" value="First Bank of Nigeria">First Bank of Nigeria</SelectItem>, <SelectItem key="fidelity" value="Fidelity Bank">Fidelity Bank</SelectItem>, <SelectItem key="union" value="Union Bank">Union Bank</SelectItem>, <SelectItem key="sterling" value="Sterling Bank">Sterling Bank</SelectItem>, <SelectItem key="fcmb" value="First City Monument Bank">First City Monument Bank</SelectItem>, <SelectItem key="ecobank" value="Ecobank">Ecobank</SelectItem>]}
                            {newEmployee.nationality === "American" && [<SelectItem key="chase" value="JPMorgan Chase">JPMorgan Chase</SelectItem>, <SelectItem key="boa" value="Bank of America">Bank of America</SelectItem>, <SelectItem key="wells" value="Wells Fargo">Wells Fargo</SelectItem>, <SelectItem key="citi" value="Citibank">Citibank</SelectItem>, <SelectItem key="pnc" value="PNC Bank">PNC Bank</SelectItem>, <SelectItem key="capital" value="Capital One">Capital One</SelectItem>, <SelectItem key="td" value="TD Bank">TD Bank</SelectItem>, <SelectItem key="usbank" value="U.S. Bank">U.S. Bank</SelectItem>]}
                            {newEmployee.nationality === "British" && [<SelectItem key="barclays" value="Barclays">Barclays</SelectItem>, <SelectItem key="lloyds" value="Lloyds Bank">Lloyds Bank</SelectItem>, <SelectItem key="hsbc" value="HSBC UK">HSBC UK</SelectItem>, <SelectItem key="natwest" value="NatWest">NatWest</SelectItem>, <SelectItem key="santander" value="Santander UK">Santander UK</SelectItem>, <SelectItem key="halifax" value="Halifax">Halifax</SelectItem>, <SelectItem key="nationwide" value="Nationwide">Nationwide</SelectItem>]}
                            {!["Nigerian", "American", "British"].includes(newEmployee.nationality) && newEmployee.nationality && [<SelectItem key="other" value="Other International Bank">Other International Bank</SelectItem>]}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input id="accountNumber" value={newEmployee.accountNumber || ""} onChange={e => setNewEmployee({
                        ...newEmployee,
                        accountNumber: e.target.value
                      })} placeholder="Account number" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nuban">NUBAN</Label>
                        <Input id="nuban" value={newEmployee.nuban} onChange={e => setNewEmployee({
                          ...newEmployee,
                          nuban: e.target.value
                        })} placeholder="NUBAN code" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sortCode">Sort Code</Label>
                        <Input id="sortCode" value={newEmployee.sortCode} onChange={e => setNewEmployee({
                        ...newEmployee,
                        sortCode: e.target.value
                      })} placeholder="Bank sort code" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="government" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input id="employeeId" value={newEmployee.employeeId} onChange={e => setNewEmployee({
                      ...newEmployee,
                      employeeId: e.target.value
                    })} placeholder="Auto-generated if empty" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationalId">National ID (NIN) *</Label>
                      <Input id="nationalId" value={newEmployee.nationalId} onChange={e => setNewEmployee({
                      ...newEmployee,
                      nationalId: e.target.value
                    })} placeholder="11-digit NIN" className={formErrors.nationalId ? "border-destructive" : ""} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="passportNumber">Passport Number</Label>
                      <Input id="passportNumber" value={newEmployee.passportNumber} onChange={e => setNewEmployee({
                      ...newEmployee,
                      passportNumber: e.target.value
                    })} placeholder="Passport Number" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tin">TIN</Label>
                      <Input id="tin" value={newEmployee.tin} onChange={e => setNewEmployee({
                      ...newEmployee,
                      tin: e.target.value
                    })} placeholder="Tax Identification Number" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pensionPin">Pension PIN</Label>
                      <Input id="pensionPin" value={newEmployee.pensionPin} onChange={e => setNewEmployee({
                      ...newEmployee,
                      pensionPin: e.target.value
                    })} placeholder="Pension Fund Administrator PIN" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nhfNumber">NHF Number</Label>
                      <Input id="nhfNumber" value={newEmployee.nhfNumber} onChange={e => setNewEmployee({
                      ...newEmployee,
                      nhfNumber: e.target.value
                    })} placeholder="National Housing Fund Number" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input id="taxId" value={newEmployee.taxId} onChange={e => setNewEmployee({
                    ...newEmployee,
                    taxId: e.target.value
                  })} placeholder="State Tax ID" />
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyAssets">Company Asset Documents</Label>
                      <Input id="companyAssets" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setNewEmployee({
                        ...newEmployee,
                        companyAssets: files
                      });
                    }} />
                      <p className="text-sm text-muted-foreground">
                        Upload laptop agreements, asset submission forms, etc. (PDF, DOC, DOCX, JPG, PNG)
                      </p>
                    </div>
                    <h3 className="text-lg font-medium">Document Uploads</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ninDocument">NIN Document</Label>
                        <Input id="ninDocument" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setNewEmployee({
                          ...newEmployee,
                          ninDocument: file
                        });
                      }} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passportPhoto">Passport Photo</Label>
                        <Input id="passportPhoto" type="file" accept=".jpg,.jpeg,.png" onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setNewEmployee({
                          ...newEmployee,
                          passportPhoto: file
                        });
                      }} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cv">CV/Resume</Label>
                        <Input id="cv" type="file" accept=".pdf,.doc,.docx" onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setNewEmployee({
                          ...newEmployee,
                          cv: file
                        });
                      }} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="educationCertificate">Certificate of Highest Educational Level</Label>
                        <Input id="educationCertificate" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setNewEmployee({
                          ...newEmployee,
                          educationCertificate: file
                        });
                      }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certifications">Professional Certifications</Label>
                      <Input id="certifications" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setNewEmployee({
                        ...newEmployee,
                        certifications: files
                      });
                    }} />
                      <p className="text-sm text-muted-foreground">
                        Upload multiple certification documents
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otherDocuments">Other Supporting Documents</Label>
                      <Input id="otherDocuments" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setNewEmployee({
                        ...newEmployee,
                        otherDocuments: files
                      });
                    }} />
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
                  <Button onClick={handleAddEmployee}>
                    Add Employee
                  </Button>
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
                <Input placeholder="Search employees..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
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
                  {uniqueLocations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg">
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map(department => (
                    <SelectItem key={department} value={department}>{department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterEmploymentType} onValueChange={setFilterEmploymentType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg">
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueEmploymentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="startDate" className="text-sm whitespace-nowrap">Start Date From:</Label>
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
                  <TableHead className="hidden sm:table-cell text-xs md:text-sm">Department</TableHead>
                  <TableHead className="hidden md:table-cell text-xs md:text-sm">Position</TableHead>
                  <TableHead className="hidden lg:table-cell text-xs md:text-sm">Vacation Days</TableHead>
                  <TableHead className="hidden lg:table-cell text-xs md:text-sm">Employment Type</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                  <TableHead className="text-right text-xs md:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map(employee => <TableRow key={employee.id} className="hover:bg-accent/30">
                    <TableCell className="font-medium text-xs md:text-sm">{employee.id}</TableCell>
                    <TableCell className="min-w-0">
                      <div>
                        <div className="font-medium text-xs md:text-sm truncate">{employee.firstName} {employee.lastName}</div>
                        <div className="text-xs text-muted-foreground truncate">{employee.email}</div>
                        {/* Show department on mobile when hidden */}
                        <div className="text-xs text-muted-foreground sm:hidden">{employee.department}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs md:text-sm">{employee.department}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs md:text-sm">{employee.position}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs md:text-sm">{employee.vacationDays} days</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs md:text-sm">
                      <Badge variant={employee.employmentType === 'FTE' ? 'default' : 'secondary'} className="text-xs">
                        {employee.employmentType}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 md:h-8 md:w-8 p-0">
                            <MoreHorizontal className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border shadow-lg">
                          <DropdownMenuItem className="text-xs md:text-sm" onClick={() => handleViewDetails(employee)}>
                            <Eye className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs md:text-sm" onClick={() => handleEditEmployee(employee)}>
                            <Edit className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                            Edit Employee
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs md:text-sm" onClick={() => handleDownloadProfile(employee)}>
                            <Download className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                            Download Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs md:text-sm text-destructive focus:text-destructive" onClick={() => handleDeleteEmployee(employee)}>
                            <Trash2 className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                            Delete Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                </TableRow>)}
              </TableBody>
            </Table>
          </div>
          
          {filteredEmployees.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">
              No employees found matching your search criteria.
            </div>}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={showViewDetails} onOpenChange={setShowViewDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
                <TabsTrigger value="personal" className="text-xs sm:text-sm">Personal</TabsTrigger>
                <TabsTrigger value="job" className="text-xs sm:text-sm">Job Info</TabsTrigger>
                <TabsTrigger value="financial" className="text-xs sm:text-sm">Financial</TabsTrigger>
                <TabsTrigger value="government" className="text-xs sm:text-sm">Gov IDs</TabsTrigger>
                <TabsTrigger value="additional" className="text-xs sm:text-sm">Additional</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                    <p className="text-base font-medium">{selectedEmployee.firstName || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Middle Name</Label>
                    <p className="text-base">{selectedEmployee.middleName || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                    <p className="text-base font-medium">{selectedEmployee.lastName || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                    <p className="text-base">{selectedEmployee.dateOfBirth ? format(selectedEmployee.dateOfBirth, "PPP") : 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                    <p className="text-base">{selectedEmployee.gender || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Marital Status</Label>
                    <p className="text-base">{selectedEmployee.maritalStatus || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Nationality</Label>
                    <p className="text-base">{selectedEmployee.nationality || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                    <p className="text-base">{selectedEmployee.phone || selectedEmployee.phoneNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                    <p className="text-base break-words">{selectedEmployee.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Home Address</Label>
                  <p className="text-base">{selectedEmployee.homeAddress || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Emergency Contact Name</Label>
                    <p className="text-base">{selectedEmployee.emergencyContact || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Emergency Contact Number</Label>
                    <p className="text-base">{selectedEmployee.emergencyContactNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Next of Kin Name</Label>
                    <p className="text-base">{selectedEmployee.nextOfKinName || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Next of Kin Relationship</Label>
                    <p className="text-base">{selectedEmployee.nextOfKinRelationship || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Next of Kin Phone</Label>
                    <p className="text-base">{selectedEmployee.nextOfKinPhone || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Next of Kin Email</Label>
                    <p className="text-base break-words">{selectedEmployee.nextOfKinEmail || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Next of Kin Address</Label>
                    <p className="text-base">{selectedEmployee.nextOfKinAddress || 'N/A'}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="job" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Job Title</Label>
                    <p className="text-base font-medium">{selectedEmployee.position || selectedEmployee.jobTitle || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p className="text-base">{selectedEmployee.department || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Employment Type</Label>
                    <p className="text-base">{selectedEmployee.employmentType || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Grade Level</Label>
                    <p className="text-base">{selectedEmployee.gradeLevel || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Supervisor Name</Label>
                    <p className="text-base">{selectedEmployee.supervisorName || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Work Location</Label>
                    <p className="text-base">{selectedEmployee.workLocation || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Hire Date</Label>
                    <p className="text-base">{selectedEmployee.joinDate || selectedEmployee.hireDate ? format(new Date(selectedEmployee.joinDate || selectedEmployee.hireDate), "PPP") : 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Probation Period</Label>
                    <p className="text-base">{selectedEmployee.probationPeriod || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Confirmation Date</Label>
                    <p className="text-base">{selectedEmployee.confirmationDate ? format(selectedEmployee.confirmationDate, "PPP") : 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Employment Status</Label>
                    <div className="flex items-start">
                      {getStatusBadge(selectedEmployee.status || selectedEmployee.employmentStatus)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Vacation Days</Label>
                    <p className="text-base">{selectedEmployee.vacationDays || 'N/A'} days</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Gross Salary</Label>
                  <p className="text-base font-semibold text-primary">{selectedEmployee.salary || selectedEmployee.grossSalary || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Basic Salary</Label>
                    <p className="text-base">{selectedEmployee.basicSalary || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Housing Allowance</Label>
                    <p className="text-base">{selectedEmployee.housingAllowance || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Transport Allowance</Label>
                    <p className="text-base">{selectedEmployee.transportAllowance || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Other Allowances</Label>
                    <p className="text-base">{selectedEmployee.otherAllowance || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Banking Information</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
                      <p className="text-base">{selectedEmployee.bankName || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                      <p className="text-base">{selectedEmployee.accountNumber || selectedEmployee.bankAccount || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">NUBAN</Label>
                      <p className="text-base">{selectedEmployee.nuban || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Sort Code</Label>
                      <p className="text-base">{selectedEmployee.sortCode || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="government" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                    <p className="text-sm">{selectedEmployee.id || selectedEmployee.employeeId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">National ID (NIN)</Label>
                    <p className="text-sm">{selectedEmployee.nationalId || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Passport Number</Label>
                    <p className="text-sm">{selectedEmployee.passportNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">TIN</Label>
                    <p className="text-sm">{selectedEmployee.tin || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Pension PIN</Label>
                    <p className="text-sm">{selectedEmployee.pensionPin || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">NHF Number</Label>
                    <p className="text-sm">{selectedEmployee.nhfNumber || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tax ID</Label>
                  <p className="text-sm">{selectedEmployee.taxId || 'N/A'}</p>
                </div>
              </TabsContent>

              <TabsContent value="additional" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Supporting Documents</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <FileText className="h-4 w-4" />
                    <p className="text-sm">{selectedEmployee.supportingDocuments?.length > 0 ? `${selectedEmployee.supportingDocuments.length} files uploaded` : 'No documents uploaded'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Performance History</Label>
                  <p className="text-sm">{selectedEmployee.performanceHistory || 'No performance history recorded'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Asset Allocation History</Label>
                  <p className="text-sm">{selectedEmployee.assetAllocation || 'No asset allocation recorded'}</p>
                </div>
              </TabsContent>
            </Tabs>}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditEmployee} onOpenChange={setShowEditEmployee}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editEmployee && <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
                <TabsTrigger value="personal" className="text-xs sm:text-sm">Personal</TabsTrigger>
                <TabsTrigger value="job" className="text-xs sm:text-sm">Job Info</TabsTrigger>
                <TabsTrigger value="financial" className="text-xs sm:text-sm">Financial</TabsTrigger>
                <TabsTrigger value="government" className="text-xs sm:text-sm">Gov IDs</TabsTrigger>
                <TabsTrigger value="additional" className="text-xs sm:text-sm">Additional</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editFirstName">First Name *</Label>
                    <Input id="editFirstName" value={editEmployee.firstName || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      firstName: e.target.value
                    })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMiddleName">Middle Name</Label>
                    <Input id="editMiddleName" value={editEmployee.middleName || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      middleName: e.target.value
                    })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLastName">Last Name *</Label>
                    <Input id="editLastName" value={editEmployee.lastName || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      lastName: e.target.value
                    })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editEmployee.dateOfBirth && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editEmployee.dateOfBirth ? format(new Date(editEmployee.dateOfBirth), "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar 
                          mode="single" 
                          selected={editEmployee.dateOfBirth ? new Date(editEmployee.dateOfBirth) : undefined} 
                          onSelect={(date) => setEditEmployee({
                            ...editEmployee,
                            dateOfBirth: date
                          })} 
                          initialFocus 
                          className="p-3 pointer-events-auto" 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editGender">Gender</Label>
                    <Select value={editEmployee.gender || ''} onValueChange={value => setEditEmployee({
                      ...editEmployee,
                      gender: value
                    })}>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editMaritalStatus">Marital Status</Label>
                    <Select value={editEmployee.maritalStatus || ''} onValueChange={value => setEditEmployee({
                      ...editEmployee,
                      maritalStatus: value
                    })}>
                      <SelectTrigger>
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
                    <Label htmlFor="editNationality">Nationality *</Label>
                    <Input id="editNationality" value={editEmployee.nationality || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      nationality: e.target.value
                    })} placeholder="e.g., Nigerian" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editPhoneNumber">Phone Number *</Label>
                    <Input id="editPhoneNumber" value={editEmployee.phone || editEmployee.phoneNumber || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      phone: e.target.value,
                      phoneNumber: e.target.value
                    })} placeholder="+234 XXX XXX XXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">Email Address *</Label>
                    <Input id="editEmail" type="email" value={editEmployee.email || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      email: e.target.value
                    })} placeholder="employee@company.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editHomeAddress">Home Address</Label>
                  <Textarea id="editHomeAddress" value={editEmployee.homeAddress || ''} onChange={e => setEditEmployee({
                    ...editEmployee,
                    homeAddress: e.target.value
                  })} placeholder="Full residential address" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editEmergencyContact">Emergency Contact Name</Label>
                    <Input id="editEmergencyContact" value={editEmployee.emergencyContact || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      emergencyContact: e.target.value
                    })} placeholder="Full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEmergencyContactNumber">Emergency Contact Number</Label>
                    <Input id="editEmergencyContactNumber" value={editEmployee.emergencyContactNumber || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      emergencyContactNumber: e.target.value
                    })} placeholder="Phone number" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editNextOfKinName">Next of Kin Name</Label>
                    <Input id="editNextOfKinName" value={editEmployee.nextOfKinName || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      nextOfKinName: e.target.value
                    })} placeholder="Full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editNextOfKinRelationship">Next of Kin Relationship</Label>
                    <Input id="editNextOfKinRelationship" value={editEmployee.nextOfKinRelationship || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      nextOfKinRelationship: e.target.value
                    })} placeholder="e.g., Spouse, Parent, Sibling" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editNextOfKinPhone">Next of Kin Phone Number</Label>
                    <Input id="editNextOfKinPhone" value={editEmployee.nextOfKinPhone || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      nextOfKinPhone: e.target.value
                    })} placeholder="+234 XXX XXX XXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editNextOfKinEmail">Next of Kin Email</Label>
                    <Input id="editNextOfKinEmail" type="email" value={editEmployee.nextOfKinEmail || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      nextOfKinEmail: e.target.value
                    })} placeholder="nextofkin@email.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editNextOfKinAddress">Next of Kin Address</Label>
                  <Textarea id="editNextOfKinAddress" value={editEmployee.nextOfKinAddress || ''} onChange={e => setEditEmployee({
                    ...editEmployee,
                    nextOfKinAddress: e.target.value
                  })} placeholder="Full address of next of kin" />
                </div>
              </TabsContent>

              <TabsContent value="job" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editJobTitle">Job Title *</Label>
                    <Input id="editJobTitle" value={editEmployee.position || editEmployee.jobTitle || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      position: e.target.value,
                      jobTitle: e.target.value
                    })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDepartment">Department *</Label>
                    <Select value={editEmployee.department || ''} onValueChange={value => setEditEmployee({
                      ...editEmployee,
                      department: value
                    })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-lg">
                        {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editEmploymentType">Employment Type *</Label>
                    <Select value={editEmployee.employmentType || ''} onValueChange={value => setEditEmployee({
                      ...editEmployee,
                      employmentType: value
                    })}>
                      <SelectTrigger>
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
                    <Label htmlFor="editGradeLevel">Grade Level</Label>
                    <Select value={editEmployee.gradeLevel || ''} onValueChange={value => setEditEmployee({
                      ...editEmployee,
                      gradeLevel: value
                    })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade level" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-lg">
                        {gradeLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editSupervisorName">Supervisor Name</Label>
                    <Input id="editSupervisorName" value={editEmployee.supervisorName || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      supervisorName: e.target.value
                    })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editWorkLocation">Work Location</Label>
                    <Input id="editWorkLocation" value={editEmployee.workLocation || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      workLocation: e.target.value
                    })} placeholder="e.g., Lagos Office" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Hire Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editEmployee.hireDate && !editEmployee.joinDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editEmployee.hireDate || editEmployee.joinDate ? format(new Date(editEmployee.hireDate || editEmployee.joinDate), "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar 
                          mode="single" 
                          selected={editEmployee.hireDate ? new Date(editEmployee.hireDate) : editEmployee.joinDate ? new Date(editEmployee.joinDate) : undefined} 
                          onSelect={date => setEditEmployee({
                            ...editEmployee,
                            hireDate: date,
                            joinDate: date ? format(date, 'yyyy-MM-dd') : undefined
                          })} 
                          initialFocus 
                          className="p-3 pointer-events-auto" 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editProbationPeriod">Probation Period</Label>
                    <Input id="editProbationPeriod" value={editEmployee.probationPeriod || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      probationPeriod: e.target.value
                    })} placeholder="e.g., 3 months" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmation Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editEmployee.confirmationDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editEmployee.confirmationDate ? format(new Date(editEmployee.confirmationDate), "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar 
                          mode="single" 
                          selected={editEmployee.confirmationDate ? new Date(editEmployee.confirmationDate) : undefined} 
                          onSelect={date => setEditEmployee({
                            ...editEmployee,
                            confirmationDate: date
                          })} 
                          initialFocus 
                          className="p-3 pointer-events-auto" 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editStatus">Employment Status</Label>
                    <Select value={editEmployee.status || editEmployee.employmentStatus || ''} onValueChange={value => setEditEmployee({
                      ...editEmployee,
                      status: value,
                      employmentStatus: value
                    })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-lg">
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On-Leave">On-Leave</SelectItem>
                        <SelectItem value="Time-Off">Time-Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editVacationDays">Vacation Days</Label>
                    <Input id="editVacationDays" type="number" value={editEmployee.vacationDays || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      vacationDays: parseInt(e.target.value) || 0
                    })} placeholder="25" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editGrossSalary">Gross Salary</Label>
                  <Input id="editGrossSalary" value={editEmployee.salary || editEmployee.grossSalary || ''} onChange={e => setEditEmployee({
                    ...editEmployee,
                    salary: e.target.value,
                    grossSalary: e.target.value
                  })} placeholder="₦2,500,000" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editBasicSalary">Basic Salary</Label>
                    <Input id="editBasicSalary" value={editEmployee.basicSalary || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      basicSalary: e.target.value
                    })} placeholder="₦1,000,000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editHousingAllowance">Housing Allowance</Label>
                    <Input id="editHousingAllowance" value={editEmployee.housingAllowance || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      housingAllowance: e.target.value
                    })} placeholder="₦500,000" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editTransportAllowance">Transport Allowance</Label>
                    <Input id="editTransportAllowance" value={editEmployee.transportAllowance || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      transportAllowance: e.target.value
                    })} placeholder="₦225,000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editOtherAllowance">Other Allowances</Label>
                    <Input id="editOtherAllowance" value={editEmployee.otherAllowance || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      otherAllowance: e.target.value
                    })} placeholder="₦775,000" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-medium">Banking Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editBankName">Bank Name</Label>
                      <Input id="editBankName" value={editEmployee.bankName || ''} onChange={e => setEditEmployee({
                        ...editEmployee,
                        bankName: e.target.value
                      })} placeholder="Bank name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editAccountNumber">Account Number</Label>
                      <Input id="editAccountNumber" value={editEmployee.accountNumber || editEmployee.bankAccount || ''} onChange={e => setEditEmployee({
                        ...editEmployee,
                        accountNumber: e.target.value,
                        bankAccount: e.target.value
                      })} placeholder="Account number" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editNuban">NUBAN</Label>
                      <Input id="editNuban" value={editEmployee.nuban || ''} onChange={e => setEditEmployee({
                        ...editEmployee,
                        nuban: e.target.value
                      })} placeholder="NUBAN code" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editSortCode">Sort Code</Label>
                      <Input id="editSortCode" value={editEmployee.sortCode || ''} onChange={e => setEditEmployee({
                        ...editEmployee,
                        sortCode: e.target.value
                      })} placeholder="Sort code" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="government" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editEmployeeId">Employee ID</Label>
                    <Input id="editEmployeeId" value={editEmployee.id || editEmployee.employeeId || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      id: e.target.value,
                      employeeId: e.target.value
                    })} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editNationalId">National ID (NIN)</Label>
                    <Input id="editNationalId" value={editEmployee.nationalId || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      nationalId: e.target.value
                    })} placeholder="National ID" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editPassportNumber">Passport Number</Label>
                    <Input id="editPassportNumber" value={editEmployee.passportNumber || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      passportNumber: e.target.value
                    })} placeholder="Passport number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editTin">TIN</Label>
                    <Input id="editTin" value={editEmployee.tin || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      tin: e.target.value
                    })} placeholder="TIN" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editPensionPin">Pension PIN</Label>
                    <Input id="editPensionPin" value={editEmployee.pensionPin || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      pensionPin: e.target.value
                    })} placeholder="Pension PIN" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editNhfNumber">NHF Number</Label>
                    <Input id="editNhfNumber" value={editEmployee.nhfNumber || ''} onChange={e => setEditEmployee({
                      ...editEmployee,
                      nhfNumber: e.target.value
                    })} placeholder="NHF Number" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editTaxId">Tax ID</Label>
                  <Input id="editTaxId" value={editEmployee.taxId || ''} onChange={e => setEditEmployee({
                    ...editEmployee,
                    taxId: e.target.value
                  })} placeholder="Tax ID" />
                </div>
              </TabsContent>

              <TabsContent value="additional" className="space-y-4">
                <div className="space-y-2">
                  <Label>Additional Information</Label>
                  <p className="text-sm text-muted-foreground">Extended employee information can be added here in future updates.</p>
                </div>
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditEmployee(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateEmployee}>
                  Update Employee
                </Button>
              </div>
            </Tabs>}
        </DialogContent>
      </Dialog>
    </div>;
}