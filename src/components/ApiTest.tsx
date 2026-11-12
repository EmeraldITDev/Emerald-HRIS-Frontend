import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import apiService, { Employee } from '@/lib/api';
import { API_BASE_URL } from '@/config/api';

export default function ApiTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    connection: boolean;
    employees: Employee[] | null;
    error: string | null;
  }>({
    connection: false,
    employees: null,
    error: null,
  });
  const { toast } = useToast();

  const testApiConnection = async () => {
    setIsLoading(true);
    setTestResults({ connection: false, employees: null, error: null });

    try {
      // Test 1: Basic connection
      const connectionTest = await apiService.testConnection();
      console.log('Connection test result:', connectionTest);

      // Test 2: Get employees
      const employees = await apiService.getEmployees();
      console.log('Employees data:', employees);

      setTestResults({
        connection: true,
        employees,
        error: null,
      });

      toast({
        title: 'API Test Successful',
        description: 'Successfully connected to backend API',
      });
    } catch (error) {
      console.error('API test failed:', error);
      setTestResults({
        connection: false,
        employees: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      toast({
        title: 'API Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testCreateEmployee = async () => {
    setIsLoading(true);

    try {
      const testEmployee: Employee = {
        first_name: 'Test',
        last_name: 'Employee',
        email: `test.employee.${Date.now()}@company.com`,
        dob: '1990-01-01',
        job_title: 'Test Position',
        gross_salary: 1000000,
        department: 'Testing',
        employment_type: 'Full-time',
        employment_status: 'Active',
        phone_number: '+234 123 456 7890',
      };

      const result = await apiService.createEmployee(testEmployee);
      console.log('Create employee result:', result);

      toast({
        title: 'Employee Created',
        description: 'Test employee created successfully',
      });

      // Refresh the employee list
      const employees = await apiService.getEmployees();
      setTestResults(prev => ({ ...prev, employees }));
    } catch (error) {
      console.error('Create employee test failed:', error);
      toast({
        title: 'Create Employee Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            API Communication Test
            <Badge variant={testResults.connection ? 'default' : 'destructive'}>
              {testResults.connection ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={testApiConnection} 
              disabled={isLoading}
              variant="default"
            >
              {isLoading ? 'Testing...' : 'Test API Connection'}
            </Button>
            <Button 
              onClick={testCreateEmployee} 
              disabled={isLoading || !testResults.connection}
              variant="outline"
            >
              Test Create Employee
            </Button>
          </div>

          {testResults.error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="font-semibold text-destructive mb-2">Error:</h4>
              <p className="text-sm text-destructive">{testResults.error}</p>
            </div>
          )}

          {testResults.employees && (
            <div className="space-y-2">
              <h4 className="font-semibold">Employees from Database ({testResults.employees.length}):</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {testResults.employees.map((employee) => (
                  <div 
                    key={employee.id} 
                    className="p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.job_title} • {employee.department}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ID: {employee.id}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p><strong>Backend URL:</strong> {API_BASE_URL}</p>
            <p><strong>Available Endpoints:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>GET /test - Test connection</li>
              <li>GET /employees-full - Get all employees</li>
              <li>POST /employees-full - Create new employee</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

