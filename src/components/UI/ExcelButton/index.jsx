"use client";
import React, { useState } from "react";
import {
  fetchStudentsGradesData,
  fetchStudentsDetailedGradesData,
  generateExcelFromStudentsData,
  generateDetailedExcelFromStudentsData,
  generateGroupedExcelFromStudentsData,
  downloadExcelFile,
} from "../../../app/utils/excelUtils";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";

const DownloadExcelButton = ({
  id_mk,
  courseName = "",
  studentsData,
  selectedForms,
  className = "",
  exportType = "grouped", // "summary", "detailed", "grouped"
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const getButtonText = () => {
    switch (exportType) {
      case "detailed":
        return "Unduh Excel Detail";
      case "grouped":
        return "Unduh Excel Grup";
      default:
        return "Unduh Excel";
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      let dataToProcess = studentsData;
      let courseNameToUse = courseName || "Mata Kuliah";

      // Jika data belum ada atau kita butuh data detail, fetch dari API
      if (!dataToProcess || exportType !== "summary") {
        let result;
        if (exportType === "detailed" || exportType === "grouped") {
          // Pastikan fungsi ini ada di excelUtils
          result = await fetchStudentsDetailedGradesData(id_mk);
        } else {
          result = await fetchStudentsGradesData(id_mk);
        }

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch data");
        }

        dataToProcess = result.data;
      }

      // Validasi data
      if (!dataToProcess || dataToProcess.length === 0) {
        throw new Error("Tidak ada data untuk diexport");
      }

      // Generate Excel file berdasarkan tipe export
      let workbook;
      switch (exportType) {
        case "detailed":
          const detailedResult = await generateDetailedExcelFromStudentsData(
            dataToProcess,
            courseNameToUse,
            selectedForms
          );
          workbook = detailedResult.workbook;
          break;

        case "grouped":
          const groupedResult = await generateGroupedExcelFromStudentsData(
            dataToProcess,
            courseNameToUse,
            selectedForms
          );
          workbook = groupedResult.workbook;
          break;

        default: // summary
          const summaryResult = await generateExcelFromStudentsData(
            dataToProcess,
            courseNameToUse,
            selectedForms
          );
          workbook = summaryResult.workbook;
          break;
      }

      if (!workbook) {
        throw new Error("Failed to generate workbook");
      }

      // Download file
      const downloadResult = await downloadExcelFile(workbook, courseNameToUse);

      if (downloadResult.success) {
        // Show success message (you can replace with toast notification)
        // Optional: Show toast notification instead of alert
        toast.success("File Excel berhasil didownload!");
      } else {
        throw new Error(downloadResult.error);
      }
    } catch (error) {
      console.error("Download error:", error);

      // Provide more specific error messages
      let errorMessage = "Gagal download file: ";
      if (error.message.includes("not a function")) {
        errorMessage +=
          "Fungsi tidak ditemukan. Pastikan semua fungsi telah diimport dengan benar.";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage += "Gagal mengambil data dari server. Silakan coba lagi.";
      } else if (error.message.includes("No data")) {
        errorMessage += "Tidak ada data untuk diexport.";
      } else {
        errorMessage += error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`${className} rounded-md bg-transparent`}
    >
      {isDownloading ? (
        <div className="flex items-center gap-1 w-fit p-2 text-white text-sm bg-green-600 hover:bg-green-700 text-nowrap text-center rounded-md transition-colors opacity-75 cursor-not-allowed">
          <PiMicrosoftExcelLogoFill
            size={24}
            className="text-white text-lg animate-pulse"
          />
          Mengunduh...
        </div>
      ) : (
        <div className="flex items-center gap-1 w-fit p-2 text-white text-sm bg-green-600 hover:bg-green-700 text-nowrap text-center rounded-md transition-colors">
          <PiMicrosoftExcelLogoFill size={24} className="text-white text-lg" />
          {getButtonText()}
        </div>
      )}
    </button>
  );
};

export default DownloadExcelButton;
