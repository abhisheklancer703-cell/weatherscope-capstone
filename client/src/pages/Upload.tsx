import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUploadWeather, useClearWeather, type WeatherUploadPayload } from "@/hooks/use-weather";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileType, AlertCircle, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { format } from "date-fns";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [parsedData, setParsedData] = useState<WeatherUploadPayload[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const uploadMutation = useUploadWeather();
  const clearMutation = useClearWeather();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file.",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  // Flexible date parser — supports multiple formats (like pandas to_datetime with errors='coerce')
  const parseFlexibleDate = (dateStr: string): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const trimmed = dateStr.trim();

    // Try native JS parsing first (handles ISO: YYYY-MM-DD, MM/DD/YYYY, etc.)
    const native = new Date(trimmed);
    if (!isNaN(native.getTime())) return native;

    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmy) {
      const d = new Date(`${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`);
      if (!isNaN(d.getTime())) return d;
    }

    // YYYY/MM/DD
    const ymd = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (ymd) {
      const d = new Date(`${ymd[1]}-${ymd[2].padStart(2,'0')}-${ymd[3].padStart(2,'0')}`);
      if (!isNaN(d.getTime())) return d;
    }

    // DD MMM YYYY (e.g., 15 Jan 2023)
    const dmonthy = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
    if (dmonthy) {
      const d = new Date(`${dmonthy[2]} ${dmonthy[1]}, ${dmonthy[3]}`);
      if (!isNaN(d.getTime())) return d;
    }

    // MMM DD, YYYY (e.g., Jan 15, 2023)
    const monthdY = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
    if (monthdY) {
      const d = new Date(`${monthdY[1]} ${monthdY[2]}, ${monthdY[3]}`);
      if (!isNaN(d.getTime())) return d;
    }

    return null; // coerce to null (like pandas errors='coerce')
  };

  const parseCSV = (file: File) => {
    setIsParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Validate and transform headers
          // Expected headers: Date, Temperature, Rainfall, Humidity
          const data = results.data;
          
          if (data.length === 0) {
             throw new Error("File is empty");
          }

          // Simple validation of first row keys
          const keys = Object.keys(data[0] as object).map(k => k.toLowerCase());
          const required = ['date', 'temperature', 'rainfall', 'humidity'];
          const missing = required.filter(r => !keys.some(k => k.includes(r)));
          
          if (missing.length > 0) {
            throw new Error(`Missing columns: ${missing.join(", ")}`);
          }

          // Transform to schema
          const transformed: WeatherUploadPayload[] = data.map((row: any) => {
            // Flexible key matching
            const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('date')) || 'Date';
            const tempKey = Object.keys(row).find(k => k.toLowerCase().includes('temp')) || 'Temperature';
            const rainKey = Object.keys(row).find(k => k.toLowerCase().includes('rain')) || 'Rainfall';
            const humKey = Object.keys(row).find(k => k.toLowerCase().includes('hum')) || 'Humidity';

            const dateStr = row[dateKey];
            // Flexible date parsing — coerces invalid dates to null (like pandas to_datetime errors='coerce')
            const date = parseFlexibleDate(dateStr);
            if (!date) throw new Error(`Unrecognized date format: "${dateStr}". Supported: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY, MMM DD YYYY`);

            return {
              date: date.toISOString(), // convert to ISO before sending to backend
              temperature: parseFloat(row[tempKey]),
              rainfall: parseFloat(row[rainKey]),
              humidity: parseFloat(row[humKey])
            };
          }).filter(r => !isNaN(r.temperature) && !isNaN(r.rainfall) && !isNaN(r.humidity));

          setPreview(transformed.slice(0, 5));
          setParsedData(transformed);
          setIsParsing(false);
        } catch (err: any) {
          toast({
            title: "Parsing Error",
            description: err.message,
            variant: "destructive"
          });
          setFile(null);
          setPreview([]);
          setIsParsing(false);
        }
      },
      error: (err) => {
        toast({ title: "Error reading file", description: err.message, variant: "destructive" });
        setIsParsing(false);
      }
    });
  };

  const handleUpload = () => {
    if (parsedData.length === 0) return;
    
    uploadMutation.mutate(parsedData, {
      onSuccess: (data) => {
        toast({
          title: "Upload Successful",
          description: `${data.count} records processed successfully.`,
        });
        setFile(null);
        setPreview([]);
        setParsedData([]);
      },
      onError: (err) => {
        toast({
          title: "Upload Failed",
          description: err.message,
          variant: "destructive"
        });
      }
    });
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to delete all weather data? This cannot be undone.")) {
      clearMutation.mutate(undefined, {
        onSuccess: () => {
          toast({ title: "Data Cleared", description: "All records have been removed." });
        },
        onError: (err) => {
           toast({ title: "Failed", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Upload</h1>
          <p className="text-muted-foreground mt-2">
            Import meteorological datasets (CSV) for analysis.
          </p>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleClear}
          disabled={clearMutation.isPending}
          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 shadow-sm"
        >
          {clearMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
          Clear Database
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Upload Card */}
        <Card className="md:col-span-2 border-dashed border-2 shadow-none bg-slate-50/50">
          <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-4">
              <UploadCloud className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-semibold">Click to upload or drag and drop</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">
              CSV files only. Required columns: Date, Temperature, Rainfall, Humidity.
            </p>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <Button onClick={() => fileInputRef.current?.click()} size="lg">
              Select CSV File
            </Button>
          </CardContent>
        </Card>

        {/* File Status */}
        {file && (
          <Card className="md:col-span-2 overflow-hidden border-blue-200 shadow-md">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                    <FileType className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{file.name}</CardTitle>
                    <CardDescription>
                      {(file.size / 1024).toFixed(2)} KB • {parsedData.length} records found
                    </CardDescription>
                  </div>
                </div>
                {isParsing ? (
                   <span className="flex items-center text-sm text-amber-600 font-medium">
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...
                   </span>
                ) : (
                  <span className="flex items-center text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Valid CSV
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-b bg-slate-50 p-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Data Preview (First 5 Rows)
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Temperature (°C)</TableHead>
                    <TableHead>Rainfall (mm)</TableHead>
                    <TableHead>Humidity (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {format(new Date(row.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{row.temperature}</TableCell>
                      <TableCell>{row.rainfall}</TableCell>
                      <TableCell>{row.humidity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-6 bg-slate-50/30 flex justify-end gap-3 border-t">
                <Button variant="outline" onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setParsedData([]);
                }}>Cancel</Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploadMutation.isPending || parsedData.length === 0}
                  className="bg-green-600 hover:bg-green-500 text-white shadow-md shadow-green-500/20"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Import Data"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {!file && (
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200 text-sm text-blue-900 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Format Instructions</p>
            <p className="opacity-90">
              Ensure your CSV file contains headers. The system automatically detects Date, Temperature, Rainfall, and Humidity columns.
              Supported date formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY (e.g. 15 Jan 2023), MMM DD YYYY (e.g. Jan 15 2023).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
