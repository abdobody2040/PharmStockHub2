import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  FormControl,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image } from "lucide-react";

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  previewUrl?: string;
  onClear?: () => void;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, previewUrl, onClear, ...props }, ref) => {
    const [preview, setPreview] = React.useState<string | undefined>(previewUrl);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    
    React.useEffect(() => {
      setPreview(previewUrl);
    }, [previewUrl]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        
        // Cleanup previous preview URL if exists
        return () => URL.revokeObjectURL(objectUrl);
      }
    };
    
    const handleClear = () => {
      setPreview(undefined);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      onClear?.();
    };
    
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-center w-full">
          <Label
            htmlFor={props.id}
            className={cn(
              "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100",
              preview ? "border-primary/40" : "border-gray-300"
            )}
          >
            {preview ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute top-2 right-2 bg-gray-200/80 rounded-full p-1 hover:bg-gray-300/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 10MB)</p>
              </div>
            )}
            <Input
              ref={(e) => {
                if (typeof ref === 'function') ref(e);
                else if (ref) ref.current = e;
                inputRef.current = e;
              }}
              id={props.id}
              type="file"
              className="hidden"
              onChange={(e) => {
                handleChange(e);
                props.onChange?.(e);
              }}
              accept="image/*"
              {...props}
            />
          </Label>
        </div>
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

interface FormFileInputProps extends FileInputProps {
  form: any;
  name: string;
  label?: string;
  description?: string;
}

const FormFileInput: React.FC<FormFileInputProps> = ({
  form,
  name,
  label,
  description,
  ...props
}) => {
  return (
    <FormItem>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <FileInput
          {...props}
          onChange={(e) => {
            const file = e.target.files?.[0];
            form.setValue(name, file);
          }}
          onClear={() => form.setValue(name, null)}
        />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};

export { FileInput, FormFileInput };
