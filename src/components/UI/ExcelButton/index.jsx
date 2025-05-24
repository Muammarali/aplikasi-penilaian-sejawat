"use client";
import React, { useState } from "react";
import {
  fetchStudentsGradesData,
  generateExcelFromStudentsData,
  downloadExcelFile,
} from "../../../app/utils/excelUtils";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";

const DownloadExcelButton = ({
  id_mk,
  courseName = "",
  studentsData,
  selectedForms,
  className = "",
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      let dataToProcess = studentsData;
      let courseNameToUse = courseName || "Mata Kuliah";

      // Jika data belum ada, fetch dari API
      if (!dataToProcess) {
        const result = await fetchStudentsGradesData(id_mk);

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch data");
        }

        dataToProcess = result.data;
      }

      // Generate Excel file
      const { workbook } = await generateExcelFromStudentsData(
        dataToProcess,
        courseNameToUse,
        selectedForms
      );

      // Download file
      const downloadResult = await downloadExcelFile(workbook, courseNameToUse);

      if (downloadResult.success) {
        // Show success message (you can replace with toast notification)
        alert("File Excel berhasil didownload!");
      } else {
        throw new Error(downloadResult.error);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Gagal download file: " + error.message);
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
        <div className="flex items-center gap-1 w-fit p-2 text-white text-sm bg-green-600 hover:bg-green-700 text-nowrap text-center rounded-md transition-colors">
          <PiMicrosoftExcelLogoFill size={24} className="text-white text-lg" />
          Mengunduh...
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 w-fit p-2 text-white text-sm bg-green-600 hover:bg-green-700 text-nowrap text-center rounded-md transition-colors">
            <PiMicrosoftExcelLogoFill
              size={24}
              className="text-white text-lg"
            />
            Unduh Excel
          </div>
        </>
      )}
    </button>
  );
};

export default DownloadExcelButton;
