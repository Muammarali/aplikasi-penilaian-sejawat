import ExcelJS from "exceljs";
import axios from "axios";

// Function untuk fetch data dari API yang sudah disesuaikan
export const fetchStudentsGradesData = async (id_mk) => {
  try {
    const response = await axios.post("/api/rekapnilai/fetch/mahasiswa", {
      id_mk: id_mk,
    });

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch data");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

// Function untuk extract unique forms dari data (dengan filter selectedForms)
export const extractFormsFromData = (studentsData, selectedForms = null) => {
  const formsSet = new Set();

  studentsData.forEach((student) => {
    if (student.nilai_per_form) {
      Object.keys(student.nilai_per_form).forEach((formId) => {
        const formIdInt = parseInt(formId);
        // Jika selectedForms ada, hanya masukkan form yang dipilih
        if (!selectedForms || selectedForms.includes(formIdInt)) {
          formsSet.add(formIdInt);
        }
      });
    }
  });

  // Convert to array dan sort
  return Array.from(formsSet).sort((a, b) => a - b);
};

// Function untuk generate Excel file dengan ExcelJS
export const generateExcelFromStudentsData = async (
  studentsData,
  courseName = "Mata Kuliah",
  selectedForms = null
) => {
  try {
    if (!studentsData || studentsData.length === 0) {
      throw new Error("No data available");
    }

    const forms = extractFormsFromData(studentsData, selectedForms);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Nilai ${courseName}`);

    worksheet.properties.defaultRowHeight = 20;

    // Define columns
    const columns = [
      { header: "No", key: "no", width: 6 },
      { header: "NPM", key: "npm", width: 18 },
      { header: "Nama", key: "nama", width: 28 },
    ];

    forms.forEach((formId) => {
      columns.push({
        header: "Hasil",
        key: `form_${formId}`,
        width: 12,
      });
    });

    worksheet.columns = columns;

    // Style header row — hanya sampai jumlah kolom tabel
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;

    worksheet.columns.forEach((column, colIndex) => {
      const cell = headerRow.getCell(colIndex + 1);
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add data rows
    studentsData.forEach((student, index) => {
      const rowData = {
        no: index + 1,
        npm: student.npm,
        nama: student.nama,
      };

      forms.forEach((formId) => {
        rowData[`form_${formId}`] = student.nilai_per_form?.[formId] || 0;
      });

      const row = worksheet.addRow(rowData);
      row.height = 22;

      // Alternating row color
      if (index % 2 === 1) {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F8F9FA" },
          };
        });
      }

      // Cell alignment & border
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (colNumber > 3) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          if (typeof cell.value === "number") {
            cell.numFmt = "0.0";
          }
        } else if (colNumber === 3) {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
      });
    });

    // Summary info di kolom F seterusnya
    const exportDate = new Date();
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(exportDate);
    const lastTableColumnIndex = worksheet.columns.length;
    const summaryStartColIndex = lastTableColumnIndex + 2;
    const summaryStartColLetter =
      worksheet.getColumn(summaryStartColIndex).letter;
    const summaryValueColLetter = worksheet.getColumn(
      summaryStartColIndex + 1
    ).letter;

    worksheet.getColumn(summaryStartColIndex).width = 22;
    worksheet.getColumn(summaryStartColIndex + 1).width = 30;

    worksheet.getCell(`${summaryStartColLetter}2`).value = "Total Mahasiswa:";
    worksheet.getCell(`${summaryStartColLetter}2`).font = { bold: true };
    worksheet.getCell(`${summaryValueColLetter}2`).value = studentsData.length;
    worksheet.getCell(`${summaryValueColLetter}2`).alignment = {
      horizontal: "left",
    };

    worksheet.getCell(`${summaryStartColLetter}3`).value = "Tanggal Export:";
    worksheet.getCell(`${summaryStartColLetter}3`).font = { bold: true };
    worksheet.getCell(`${summaryValueColLetter}3`).value = formattedDate;

    return { workbook, courseName };
  } catch (error) {
    console.error("Error generating Excel:", error);
    throw error;
  }
};

// Function untuk download file Excel
export const downloadExcelFile = async (workbook, courseName) => {
  try {
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create blob
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Generate filename
    const cleanCourseName = courseName
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "_");
    const fileName = `Nilai_${cleanCourseName}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    link.download = fileName;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Error downloading Excel:", error);
    return { success: false, error: error.message };
  }
};
