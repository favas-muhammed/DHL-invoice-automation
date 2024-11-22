import React, { useState, useRef } from "react";
import axios from "axios";

function App() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [message, setMessage] = useState("");
  const [useReferenceColumn, setUseReferenceColumn] = useState(false);
  const [referenceColumn, setReferenceColumn] = useState("");
  const [calculateTotals, setCalculateTotals] = useState(false);
  const [totalColumn, setTotalColumn] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      pdfFiles.forEach((file, index) => {
        formData.append("pdfs", file);
      });
      formData.append("excel", excelFile);

      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json, application/octet-stream",
          },
          responseType: "blob",
          withCredentials: true,
          timeout: 60000, // Increased timeout to 60 seconds
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          validateStatus: (status) => status < 500, // Treat only 500+ as errors
        }
      );

      // Create download link for the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "updated_excel.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage("Success: File processed and downloaded successfully!");
    } catch (error) {
      let errorMessage;
      if (error.response) {
        // Server responded with an error
        errorMessage = error.response.data.error || "Server error occurred";
      } else if (error.request) {
        errorMessage =
          "No response from server. Please check if the server is running.";
      } else {
        errorMessage = error.message || "Error setting up the request";
      }
      console.error("Upload error:", error);
      setMessage("Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">DHL Invoice Automation</h1>

      {/* Excel Processor Section */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Excel Row Separator</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append("excel", excelFile);
            if (useReferenceColumn) {
              formData.append("referenceColumn", referenceColumn);
            }
            formData.append("calculateTotals", calculateTotals.toString());
            formData.append("totalColumn", totalColumn);

            try {
              const response = await axios.post(
                "http://localhost:5000/process-excel",
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                  responseType: "blob",
                  withCredentials: true,
                }
              );

              // Create download link for the file
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", "processed_excel.xlsx");
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);

              setMessage("Success: Excel file processed successfully!");
            } catch (error) {
              setMessage("Error: Failed to process Excel file");
              console.error("Processing error:", error);
            }
          }}
          className="space-y-4"
        >
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block mb-2">Excel File:</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setExcelFile(e.target.files[0])}
                className="border p-2 w-full"
                required
              />
            </div>
            <div className="w-32">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="useReferenceColumn"
                  checked={useReferenceColumn}
                  onChange={(e) => setUseReferenceColumn(e.target.checked)}
                  className="form-checkbox h-4 w-4"
                />
                <label htmlFor="useReferenceColumn" className="ml-2 text-sm">
                  Use Reference
                </label>
              </div>
              {useReferenceColumn && (
                <>
                  <label className="block mb-2">Reference Column:</label>
                  <input
                    type="text"
                    placeholder="e.g., A, B, AA"
                    className="border p-2 w-full"
                    onChange={(e) =>
                      setReferenceColumn(e.target.value.toUpperCase())
                    }
                    pattern="[A-Za-z]+"
                    required={useReferenceColumn}
                  />
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="calculateTotals"
              checked={calculateTotals}
              onChange={(e) => setCalculateTotals(e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <label htmlFor="calculateTotals" className="text-sm">
              Calculate totals for specified column
            </label>
            {calculateTotals && (
              <input
                type="text"
                placeholder="Column (e.g., A, B)"
                value={totalColumn}
                onChange={(e) => setTotalColumn(e.target.value.toUpperCase())}
                className="border p-1 ml-2 w-20 text-sm"
                pattern="[A-Za-z]+"
                required={calculateTotals}
              />
            )}
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Process Excel
          </button>
        </form>
      </div>

      <h2 className="text-xl font-semibold mb-4">Invoice Processing</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">DHL invoice:</label>
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={(e) => setPdfFiles(Array.from(e.target.files))}
            className="border p-2 w-full"
            required
          />
          <div className="mt-2 text-sm text-gray-600">
            {pdfFiles.length > 0 &&
              `Selected ${pdfFiles.length} PDF file(s) (max 100)`}
          </div>
        </div>

        <div>
          <label className="block mb-2">Excel File:</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setExcelFile(e.target.files[0])}
            className="border p-2 w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Processing..." : "Upload and Process"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-4 rounded ${
            message.includes("Error") ? "bg-red-100" : "bg-green-100"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}

export default App;