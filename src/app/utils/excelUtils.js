import ExcelJS from "exceljs";
import axios from "axios";

// Function untuk fetch data mahasiswa dengan detail nilai per komponen
export const fetchStudentsDetailedGradesData = async (id_mk) => {
  try {
    const response = await axios.post(
      "/api/rekapnilai/fetch/mahasiswa/detailed",
      {
        id_mk: id_mk,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch data");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching detailed data:", error);
    throw error;
  }
};

// Function untuk fetch data mahasiswa basic (backward compatibility)
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

// Function untuk mengelompokkan mahasiswa berdasarkan komponen yang mereka miliki nilai
export const groupStudentsByComponents = (
  studentsData,
  selectedForms = null
) => {
  const groups = new Map();

  studentsData.forEach((student) => {
    if (student.nilai_per_form) {
      Object.keys(student.nilai_per_form).forEach((formId) => {
        const formIdInt = parseInt(formId);

        // Jika selectedForms ada, hanya masukkan form yang dipilih
        if (!selectedForms || selectedForms.includes(formIdInt)) {
          const formData = student.nilai_per_form[formId];

          if (formData && formData.komponen) {
            // Buat signature untuk komponen yang ada (untuk grouping)
            const komponenIds = Object.keys(formData.komponen)
              .filter(
                (komponenId) => formData.komponen[komponenId].nilai_rata > 0
              )
              .sort()
              .join("-");

            if (komponenIds) {
              const groupKey = `form_${formId}_komponen_${komponenIds}`;

              if (!groups.has(groupKey)) {
                groups.set(groupKey, {
                  formId: formIdInt,
                  komponenIds: komponenIds.split("-").map((id) => parseInt(id)),
                  komponenData: {},
                  students: [],
                });

                // Simpan data komponen untuk grup ini
                komponenIds.split("-").forEach((komponenId) => {
                  const komponenData = formData.komponen[komponenId];
                  if (komponenData) {
                    groups.get(groupKey).komponenData[komponenId] = {
                      nama: komponenData.nama_komponen,
                      bobot: komponenData.bobot,
                    };
                  }
                });
              }

              // Tambahkan student ke grup
              groups.get(groupKey).students.push(student);
            }
          }
        }
      });
    }
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.formId !== b.formId) return a.formId - b.formId;
    return a.komponenIds[0] - b.komponenIds[0];
  });
};

// Function untuk extract forms dari data (backward compatibility)
export const extractFormsFromData = (studentsData, selectedForms = null) => {
  const formsSet = new Set();

  studentsData.forEach((student) => {
    if (student.nilai_per_form) {
      Object.keys(student.nilai_per_form).forEach((formId) => {
        const formIdInt = parseInt(formId);
        if (!selectedForms || selectedForms.includes(formIdInt)) {
          formsSet.add(formIdInt);
        }
      });
    }
  });

  return Array.from(formsSet).sort((a, b) => a - b);
};

// Function untuk generate Excel file dengan pengelompokan dalam satu sheet
export const generateGroupedExcelFromStudentsData = async (
  studentsData,
  courseName = "Mata Kuliah",
  selectedForms = null
) => {
  try {
    if (!studentsData || studentsData.length === 0) {
      throw new Error("No data available");
    }

    const groups = groupStudentsByComponents(studentsData, selectedForms);
    const workbook = new ExcelJS.Workbook();

    // Buat satu worksheet untuk semua grup
    const worksheet = workbook.addWorksheet(`Nilai Grouped - ${courseName}`);
    worksheet.properties.defaultRowHeight = 20;

    let currentRow = 1;
    const spacing = 2; // Jarak antar tabel

    // Jika tidak ada grup, tampilkan pesan
    if (groups.length === 0) {
      worksheet.getCell("A1").value = "Tidak ada data nilai yang ditemukan";
      worksheet.getCell("A1").font = { bold: true, size: 14 };
      return { workbook, courseName };
    }

    // Proses setiap grup
    groups.forEach((group, groupIndex) => {
      // Header grup
      const groupHeaderCell = worksheet.getCell(`A${currentRow}`);
      groupHeaderCell.value = `Form ${group.formId} - Grup ${groupIndex + 1}`;
      groupHeaderCell.font = {
        bold: true,
        size: 12,
        color: { argb: "FFFFFF" },
      };
      groupHeaderCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "2F5233" }, // Dark green
      };
      groupHeaderCell.alignment = { vertical: "middle", horizontal: "left" };

      // Merge cells untuk header grup (sampai kolom yang dibutuhkan)
      const totalColumns = 3 + group.komponenIds.length + 1; // No, NPM, Nama + komponen + Total
      worksheet.mergeCells(
        `A${currentRow}:${
          worksheet.getColumn(totalColumns).letter
        }${currentRow}`
      );

      // Style border untuk header grup
      for (let col = 1; col <= totalColumns; col++) {
        const cell = worksheet.getCell(currentRow, col);
        cell.border = {
          top: { style: "medium", color: { argb: "2F5233" } },
          left: { style: "medium", color: { argb: "2F5233" } },
          bottom: { style: "medium", color: { argb: "2F5233" } },
          right: { style: "medium", color: { argb: "2F5233" } },
        };
      }

      currentRow++;

      // Header tabel
      const columns = [
        { header: "No", key: "no", width: 6 },
        { header: "NPM", key: "npm", width: 18 },
        { header: "Nama", key: "nama", width: 28 },
      ];

      // Add component columns
      group.komponenIds.forEach((komponenId) => {
        const komponenInfo = group.komponenData[komponenId];
        columns.push({
          header: `${komponenInfo.nama} (${komponenInfo.bobot}%)`,
          key: `komponen_${komponenId}`,
          width: 25,
        });
      });

      // Add total column
      columns.push({
        header: `Total`,
        key: "total",
        width: 10,
      });

      // Set column widths (hanya sekali di awal)
      if (groupIndex === 0) {
        columns.forEach((column, colIndex) => {
          worksheet.getColumn(colIndex + 1).width = column.width;
        });
      }

      // Header row untuk tabel
      const headerRow = worksheet.getRow(currentRow);
      headerRow.height = 25;

      columns.forEach((column, colIndex) => {
        const cell = headerRow.getCell(colIndex + 1);
        cell.value = column.header;
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

      currentRow++;

      // Data rows untuk grup ini
      group.students.forEach((student, studentIndex) => {
        const row = worksheet.getRow(currentRow);
        row.height = 22;

        const formData = student.nilai_per_form?.[group.formId];

        // Set data untuk setiap kolom
        row.getCell(1).value = studentIndex + 1; // No
        row.getCell(2).value = student.npm; // NPM
        row.getCell(3).value = student.nama; // Nama

        let colIndex = 4;
        // Component values
        group.komponenIds.forEach((komponenId) => {
          const komponenValue =
            formData?.komponen?.[komponenId]?.nilai_rata || 0;
          row.getCell(colIndex).value = komponenValue;
          colIndex++;
        });

        // Total value
        row.getCell(colIndex).value = formData?.total || 0;

        // Alternating row color
        if (studentIndex % 2 === 1) {
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (colNumber <= totalColumns) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "F8F9FA" },
              };
            }
          });
        }

        // Cell alignment & border
        for (let col = 1; col <= totalColumns; col++) {
          const cell = row.getCell(col);
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          if (col > 3) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
            if (typeof cell.value === "number") {
              cell.numFmt = "0.0";
            }
          } else if (col === 3) {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          }
        }

        currentRow++;
      });

      // Info summary untuk grup ini (di sebelah kanan tabel)
      const summaryStartCol = totalColumns + 2;
      const summaryValueCol = summaryStartCol + 1;

      if (summaryStartCol <= 16384) {
        // Set column widths untuk summary
        worksheet.getColumn(summaryStartCol).width = 22;
        worksheet.getColumn(summaryValueCol).width = 30;

        // const summaryStartRow = currentRow - group.students.length - 1; // Mulai dari header row

        // worksheet.getCell(summaryStartRow, summaryStartCol).value =
        //   "Info Grup:";
        // worksheet.getCell(summaryStartRow, summaryStartCol).font = {
        //   bold: true,
        //   color: { argb: "2F5233" },
        // };

        // worksheet.getCell(summaryStartRow + 1, summaryStartCol).value =
        //   "Total Mahasiswa:";
        // worksheet.getCell(summaryStartRow + 1, summaryStartCol).font = {
        //   bold: true,
        // };
        // worksheet.getCell(summaryStartRow + 1, summaryValueCol).value =
        //   group.students.length;

        // worksheet.getCell(summaryStartRow + 2, summaryStartCol).value =
        //   "Form ID:";
        // worksheet.getCell(summaryStartRow + 2, summaryStartCol).font = {
        //   bold: true,
        // };
        // worksheet.getCell(
        //   summaryStartRow + 2,
        //   summaryValueCol
        // ).value = `Form ${group.formId}`;

        // worksheet.getCell(summaryStartRow + 3, summaryStartCol).value =
        //   "Komponen:";
        // worksheet.getCell(summaryStartRow + 3, summaryStartCol).font = {
        //   bold: true,
        // };
        // const komponenNames = group.komponenIds
        //   .map((id) => group.komponenData[id].nama)
        //   .join(", ");
        // worksheet.getCell(summaryStartRow + 3, summaryValueCol).value =
        //   komponenNames;
      }

      // Add spacing antar grup
      currentRow += spacing;
    });

    // Add general summary di bagian bawah
    currentRow += 2;

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

    // General summary header
    worksheet.getCell(`B${currentRow}`).value = "RINGKASAN EXPORT";
    worksheet.getCell(`B${currentRow}`).font = {
      bold: true,
      size: 12,
      color: { argb: "FFFFFF" },
    };
    worksheet.getCell(`B${currentRow}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2F5233" },
    };
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);

    currentRow++;

    worksheet.getCell(`B${currentRow}`).value = "Mata Kuliah:";
    worksheet.getCell(`B${currentRow}`).font = { bold: true };
    worksheet.getCell(`C${currentRow}`).value = courseName;

    currentRow++;
    worksheet.getCell(`B${currentRow}`).value = "Total Grup:";
    worksheet.getCell(`B${currentRow}`).font = { bold: true };
    worksheet.getCell(`C${currentRow}`).value = groups.length;

    currentRow++;
    worksheet.getCell(`B${currentRow}`).value = "Total Mahasiswa:";
    worksheet.getCell(`B${currentRow}`).font = { bold: true };
    const totalStudents = groups.reduce(
      (sum, group) => sum + group.students.length,
      0
    );
    worksheet.getCell(`C${currentRow}`).value = totalStudents;

    currentRow++;
    worksheet.getCell(`B${currentRow}`).value = "Tanggal Export:";
    worksheet.getCell(`B${currentRow}`).font = { bold: true };
    worksheet.getCell(`C${currentRow}`).value = formattedDate;

    return { workbook, courseName };
  } catch (error) {
    console.error("Error generating grouped Excel:", error);
    throw error;
  }
};

// Function untuk generate Excel detailed dengan komponen detail
export const generateDetailedExcelFromStudentsData = async (
  studentsData,
  courseName = "Mata Kuliah",
  selectedForms = null
) => {
  try {
    if (!studentsData || studentsData.length === 0) {
      throw new Error("No data available");
    }

    const formsAndComponents = extractFormsAndComponentsFromData(
      studentsData,
      selectedForms
    );
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Nilai Detail ${courseName}`);

    worksheet.properties.defaultRowHeight = 20;

    // Define columns
    const columns = [
      { header: "No", key: "no", width: 6 },
      { header: "NPM", key: "npm", width: 18 },
      { header: "Nama", key: "nama", width: 28 },
    ];

    // Add columns for each form and its components
    formsAndComponents.forEach(({ formId, komponen }) => {
      // Add component columns for this form
      komponen.forEach((komponenData) => {
        columns.push({
          header: `${komponenData.nama}`,
          key: `form_${formId}_komponen_${komponenData.id}`,
          width: 25,
        });
      });

      // Add total column for this form
      columns.push({
        header: `Total`,
        key: `form_${formId}_total`,
        width: 12,
      });
    });

    worksheet.columns = columns;

    // Create multi-level header
    // Insert a new row at the top for form headers
    worksheet.spliceRows(1, 0, []);

    let currentCol = 4; // Start after No, NPM, Nama

    formsAndComponents.forEach(({ formId, komponen }) => {
      const startCol = currentCol;
      const endCol = currentCol + komponen.length; // komponen + total

      // Merge cells for form header
      worksheet.mergeCells(1, startCol, 1, endCol);
      const formHeaderCell = worksheet.getCell(1, startCol);
      formHeaderCell.value = `Komponen`;
      formHeaderCell.font = { bold: true, color: { argb: "FFFFFF" } };
      formHeaderCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" },
      };
      formHeaderCell.alignment = { vertical: "middle", horizontal: "center" };
      formHeaderCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      currentCol = endCol + 1;
    });

    // Style the main header row (row 2)
    const headerRow = worksheet.getRow(2);
    headerRow.height = 25;

    // Merge cells for No, NPM, Nama in row 1 and set their values
    worksheet.mergeCells(1, 1, 2, 1); // No
    worksheet.mergeCells(1, 2, 2, 2); // NPM
    worksheet.mergeCells(1, 3, 2, 3); // Nama

    // Set values and style basic info headers
    const basicHeaders = [
      { col: 1, value: "No" },
      { col: 2, value: "NPM" },
      { col: 3, value: "Nama" },
    ];

    basicHeaders.forEach(({ col, value }) => {
      const cell = worksheet.getCell(1, col);
      cell.value = value;
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

    // Style component and total headers in row 2 (skip kolom 1-3 karena sudah di-merge)
    let colIndex = 4; // Start from column 4
    formsAndComponents.forEach(({ formId, komponen }) => {
      // Style component headers
      komponen.forEach((komponenData) => {
        const cell = headerRow.getCell(colIndex);
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
        colIndex++;
      });

      // Style total header
      const totalCell = headerRow.getCell(colIndex);
      totalCell.font = { bold: true, color: { argb: "FFFFFF" } };
      totalCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" },
      };
      totalCell.alignment = { vertical: "middle", horizontal: "center" };
      totalCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      colIndex++;
    });

    // Add data rows (starting from row 3)
    studentsData.forEach((student, index) => {
      const rowData = {
        no: index + 1,
        npm: student.npm,
        nama: student.nama,
      };

      // Add values for each form and component
      formsAndComponents.forEach(({ formId, komponen }) => {
        const formData = student.nilai_per_form?.[formId];

        // Add component values
        komponen.forEach((komponenData) => {
          const komponenValue =
            formData?.komponen?.[komponenData.id]?.nilai_rata || 0;
          rowData[`form_${formId}_komponen_${komponenData.id}`] = komponenValue;
        });

        // Add total value
        const totalValue = formData?.total || 0;
        rowData[`form_${formId}_total`] = totalValue;
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

    // Summary info
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

    // Pastikan kolom summary ada
    if (summaryStartColIndex <= 16384) {
      // Excel limit
      const summaryStartColLetter =
        worksheet.getColumn(summaryStartColIndex).letter;
      const summaryValueColLetter = worksheet.getColumn(
        summaryStartColIndex + 1
      ).letter;

      worksheet.getColumn(summaryStartColIndex).width = 22;
      worksheet.getColumn(summaryStartColIndex + 1).width = 30;

      worksheet.getCell(`${summaryStartColLetter}3`).value = "Total Mahasiswa:";
      worksheet.getCell(`${summaryStartColLetter}3`).font = { bold: true };
      worksheet.getCell(`${summaryValueColLetter}3`).value =
        studentsData.length;
      worksheet.getCell(`${summaryValueColLetter}3`).alignment = {
        horizontal: "left",
      };

      worksheet.getCell(`${summaryStartColLetter}4`).value = "Tanggal Export:";
      worksheet.getCell(`${summaryStartColLetter}4`).font = { bold: true };
      worksheet.getCell(`${summaryValueColLetter}4`).value = formattedDate;
    }

    return { workbook, courseName };
  } catch (error) {
    console.error("Error generating detailed Excel:", error);
    throw error;
  }
};

// Function untuk extract forms dan komponen dari data yang sudah ada
export const extractFormsAndComponentsFromData = (
  studentsData,
  selectedForms = null
) => {
  const formsMap = new Map();

  studentsData.forEach((student) => {
    if (student.nilai_per_form) {
      Object.keys(student.nilai_per_form).forEach((formId) => {
        const formIdInt = parseInt(formId);

        // Jika selectedForms ada, hanya masukkan form yang dipilih
        if (!selectedForms || selectedForms.includes(formIdInt)) {
          if (!formsMap.has(formIdInt)) {
            formsMap.set(formIdInt, new Map());
          }

          // Extract komponen dari form ini
          const formData = student.nilai_per_form[formId];
          if (formData && formData.komponen) {
            Object.keys(formData.komponen).forEach((komponenId) => {
              const komponenIdInt = parseInt(komponenId);
              const komponenData = formData.komponen[komponenId];

              // Simpan info komponen (nama dan bobot)
              if (komponenData && komponenData.nama_komponen) {
                formsMap.get(formIdInt).set(komponenIdInt, {
                  nama: komponenData.nama_komponen,
                  bobot: komponenData.bobot,
                });
              }
            });
          }
        }
      });
    }
  });

  // Convert to structured format
  const result = [];
  formsMap.forEach((komponenMap, formId) => {
    const komponen = Array.from(komponenMap.entries())
      .sort((a, b) => a[0] - b[0]) // Sort by komponen ID
      .map(([id, data]) => ({
        id: id,
        nama: data.nama,
        bobot: data.bobot,
      }));

    result.push({
      formId: formId,
      komponen: komponen,
    });
  });

  return result.sort((a, b) => a.formId - b.formId);
};

// Function untuk generate Excel summary (backward compatibility)
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

    // Style header row
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
        // Gunakan total jika ada struktur detail, jika tidak gunakan nilai langsung
        const formData = student.nilai_per_form?.[formId];
        if (typeof formData === "object" && formData.total !== undefined) {
          rowData[`form_${formId}`] = formData.total;
        } else {
          rowData[`form_${formId}`] = formData || 0;
        }
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

    // Summary info
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
export const downloadExcelFile = async (
  workbook,
  courseName,
  exportType = "summary"
) => {
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

    // Generate filename based on export type
    const cleanCourseName = courseName
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "_");

    let filePrefix = "";
    switch (exportType) {
      case "detailed":
        filePrefix = "Nilai_Detail_";
        break;
      case "grouped":
        filePrefix = "Nilai_Grouped_";
        break;
      default:
        filePrefix = "Nilai_Summary_";
        break;
    }

    const fileName = `${filePrefix}${cleanCourseName}_${
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
