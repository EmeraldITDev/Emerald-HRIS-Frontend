import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateInputProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  yearRange?: number
  showYearMonthPicker?: boolean
}

export function DateInput({
  value,
  onChange,
  placeholder = "MM/DD/YY",
  className,
  disabled = false,
  minDate,
  maxDate,
  yearRange = 80,
  showYearMonthPicker = true,
}: DateInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)

  // Update input value when date prop changes
  React.useEffect(() => {
    if (value) {
      setInputValue(format(value, "MM/dd/yy"))
    } else {
      setInputValue("")
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Try to parse the date in multiple formats
    const formats = ["MM/dd/yy", "MM/dd/yyyy", "M/d/yy", "M/d/yyyy"]
    
    for (const formatString of formats) {
      try {
        const parsedDate = parse(newValue, formatString, new Date())
        if (isValid(parsedDate)) {
          // Check if date is within allowed range
          if (minDate && parsedDate < minDate) return
          if (maxDate && parsedDate > maxDate) return
          
          onChange?.(parsedDate)
          return
        }
      } catch {
        continue
      }
    }

    // If no valid format found and input is empty, clear the date
    if (newValue === "") {
      onChange?.(undefined)
    }
  }

  const handleInputBlur = () => {
    // Reformat the input to MM/dd/yy on blur if valid
    if (value) {
      setInputValue(format(value, "MM/dd/yy"))
    }
  }

  const handleYearChange = (year: string) => {
    const currentDate = value || new Date()
    const newDate = new Date(parseInt(year), currentDate.getMonth(), currentDate.getDate())
    onChange?.(newDate)
  }

  const handleMonthChange = (month: string) => {
    const currentDate = value || new Date()
    const newDate = new Date(currentDate.getFullYear(), parseInt(month), currentDate.getDate())
    onChange?.(newDate)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: yearRange }, (_, i) => currentYear - i)
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className={cn("flex-1", className)}
        disabled={disabled}
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "px-3",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          {showYearMonthPicker && (
            <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b">
              <div className="flex items-center gap-2">
                <Select
                  value={value ? value.getFullYear().toString() : ""}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg max-h-48">
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={value ? value.getMonth().toString() : ""}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg">
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date)
              setIsOpen(false)
            }}
            disabled={(date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
