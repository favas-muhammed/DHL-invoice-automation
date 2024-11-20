import React, { useState } from "react";
import axios from "axios";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">PDF File:</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
            className="border p-2 w-full"
            required
          />
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
