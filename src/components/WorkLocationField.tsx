import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STANDARD_WORK_LOCATIONS,
  formatWorkLocation,
  parseWorkLocation,
} from "@/constants/workLocations";

type WorkLocationFieldProps = {
  id?: string;
  label?: string;
  required?: boolean;
  value?: string;
  onChange: (storedValue: string) => void;
  className?: string;
  error?: boolean;
};

export function WorkLocationField({
  id = "workLocation",
  label = "Work Location",
  required = false,
  value = "",
  onChange,
  className,
  error,
}: WorkLocationFieldProps) {
  const parsed = parseWorkLocation(value);
  const preset = parsed.preset || undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Select
        value={preset}
        onValueChange={(next) => {
          if (next === "Other") {
            onChange(formatWorkLocation("Other", parsed.otherDetail));
          } else {
            onChange(next);
          }
        }}
      >
        <SelectTrigger id={id} className={className ?? (error ? "border-destructive" : undefined)}>
          <SelectValue placeholder="Select work location" />
        </SelectTrigger>
        <SelectContent className="bg-popover border shadow-lg">
          {STANDARD_WORK_LOCATIONS.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {loc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {preset === "Other" && (
        <div className="space-y-2">
          <Label htmlFor={`${id}-other`}>Other Work Location</Label>
          <Input
            id={`${id}-other`}
            value={parsed.otherDetail}
            onChange={(e) => onChange(formatWorkLocation("Other", e.target.value))}
            placeholder="e.g., Nigeria Gas Plant 1"
            className={error ? "border-destructive" : undefined}
          />
        </div>
      )}
    </div>
  );
}
