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

    console.log(response.data);

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
// Function untuk generate Excel detailed dengan komponen detail dan info penilai
export const generateDetailedExcelFromStudentsData = async (
  studentsData,
  courseName = "Mata Kuliah",
  selectedForms = null
) => {
  try {
    if (!studentsData || studentsData.length === 0) {
      throw new Error("No data available");
    }

    // Transform data untuk mendapatkan struktur yang dibutuhkan
    const detailedDataWithAssessors = transformDataWithAssessors(
      studentsData,
      selectedForms
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Nilai Detail ${courseName}`);

    worksheet.properties.defaultRowHeight = 20;

    // Define columns
    const columns = [
      { header: "No", key: "no", width: 6 },
      { header: "NPM", key: "npm", width: 15 },
      { header: "Nama", key: "nama", width: 25 },
      { header: "NPM Penilai", key: "npm_penilai", width: 15 },
      { header: "Nama Penilai", key: "nama_penilai", width: 25 },
    ];

    // Ambil informasi komponen dari data yang ada
    const komponenInfo = extractKomponenInfo(studentsData, selectedForms);

    // Add columns for each component
    komponenInfo.forEach((komponen) => {
      columns.push({
        header: `${komponen.nama} (${komponen.bobot}%)`,
        key: `komponen_${komponen.id}`,
        width: 20,
      });
    });

    // Add total column
    columns.push({
      header: "Total",
      key: "total",
      width: 12,
    });

    // Add final result column
    columns.push({
      header: "Hasil Akhir",
      key: "hasil_akhir",
      width: 15,
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

    let rowNumber = 1;

    // Process data untuk setiap mahasiswa dan penilainya
    detailedDataWithAssessors.forEach((studentData) => {
      const { student, assessments } = studentData;
      const startRow = worksheet.rowCount + 1;

      // Untuk setiap assessment (penilai)
      assessments.forEach((assessment, assessmentIndex) => {
        const rowData = {
          no: assessmentIndex === 0 ? rowNumber : "",
          npm: assessmentIndex === 0 ? student.npm : "",
          nama: assessmentIndex === 0 ? student.nama : "",
          npm_penilai: assessment.npm_penilai,
          nama_penilai: assessment.nama_penilai,
        };

        // Add component values
        komponenInfo.forEach((komponen) => {
          const komponenValue = assessment.komponen_nilai[komponen.id] || 0;
          rowData[`komponen_${komponen.id}`] = komponenValue;
        });

        // Add total value for this assessment
        rowData.total = assessment.total || 0;

        // Add final result (rata-rata dari semua penilai) - hanya tampil di baris pertama
        if (assessmentIndex === 0) {
          rowData.hasil_akhir = student.nilai_akhir || 0;
        } else {
          rowData.hasil_akhir = "";
        }

        const row = worksheet.addRow(rowData);
        row.height = 22;

        // Alternating row color per student (bukan per row)
        if ((rowNumber - 1) % 2 === 1) {
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

          if (colNumber > 5) {
            // After Nama Penilai
            cell.alignment = { vertical: "middle", horizontal: "center" };
            if (typeof cell.value === "number") {
              cell.numFmt = "0.0";
            }
          } else if (colNumber === 3 || colNumber === 5) {
            // Nama columns
            cell.alignment = { vertical: "middle", horizontal: "left" };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          }
        });
      });

      // Merge cells untuk No, NPM, Nama, dan Hasil Akhir jika ada multiple assessors
      if (assessments.length > 1) {
        const endRow = worksheet.rowCount;

        // Merge No
        worksheet.mergeCells(startRow, 1, endRow, 1);
        const noCell = worksheet.getCell(startRow, 1);
        noCell.value = rowNumber;
        noCell.alignment = { vertical: "middle", horizontal: "center" };

        // Merge NPM
        worksheet.mergeCells(startRow, 2, endRow, 2);
        const npmCell = worksheet.getCell(startRow, 2);
        npmCell.value = student.npm;
        npmCell.alignment = { vertical: "middle", horizontal: "center" };

        // Merge Nama
        worksheet.mergeCells(startRow, 3, endRow, 3);
        const namaCell = worksheet.getCell(startRow, 3);
        namaCell.value = student.nama;
        namaCell.alignment = { vertical: "middle", horizontal: "left" };

        // Merge Hasil Akhir
        const hasilAkhirColIndex = columns.length;
        worksheet.mergeCells(
          startRow,
          hasilAkhirColIndex,
          endRow,
          hasilAkhirColIndex
        );
        const hasilAkhirCell = worksheet.getCell(startRow, hasilAkhirColIndex);
        hasilAkhirCell.value = student.nilai_akhir || 0;
        hasilAkhirCell.alignment = { vertical: "middle", horizontal: "center" };
        if (typeof hasilAkhirCell.value === "number") {
          hasilAkhirCell.numFmt = "0.0";
        }
      }

      rowNumber++;
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
      worksheet.getColumn(summaryStartColIndex).width = 22;
      worksheet.getColumn(summaryStartColIndex + 1).width = 30;

      const summaryStartColLetter =
        worksheet.getColumn(summaryStartColIndex).letter;
      const summaryValueColLetter = worksheet.getColumn(
        summaryStartColIndex + 1
      ).letter;

      worksheet.getCell(`${summaryStartColLetter}3`).value = "Total Mahasiswa:";
      worksheet.getCell(`${summaryStartColLetter}3`).font = { bold: true };
      worksheet.getCell(`${summaryValueColLetter}3`).value =
        detailedDataWithAssessors.length;
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

// Helper function untuk transform data dengan info penilai berdasarkan API response baru
const transformDataWithAssessors = (studentsData, selectedForms = null) => {
  const result = [];

  studentsData.forEach((student) => {
    const assessmentsMap = new Map();
    let totalNilaiAkhir = 0;
    let formCount = 0;

    if (student.nilai_per_form) {
      Object.keys(student.nilai_per_form).forEach((formId) => {
        const formIdInt = parseInt(formId);

        if (!selectedForms || selectedForms.includes(formIdInt)) {
          const formData = student.nilai_per_form[formId];

          if (formData && formData.assessors) {
            // Iterate through each assessor for this form
            Object.keys(formData.assessors).forEach((assessorId) => {
              const assessorInfo = formData.assessors[assessorId];
              const assessorKey = `${assessorId}_${formId}`;

              if (!assessmentsMap.has(assessorKey)) {
                assessmentsMap.set(assessorKey, {
                  npm_penilai: assessorInfo.npm_penilai,
                  nama_penilai: assessorInfo.nama_penilai,
                  komponen_nilai: {},
                  total: 0,
                  formId: formIdInt,
                  assessorId: assessorId,
                });
              }

              // Calculate total for this assessor on this form
              let assessorTotal = 0;
              if (formData.komponen) {
                Object.keys(formData.komponen).forEach((komponenId) => {
                  const komponenData = formData.komponen[komponenId];

                  if (
                    komponenData.assessors &&
                    komponenData.assessors[assessorId]
                  ) {
                    const nilaiAssessor =
                      komponenData.assessors[assessorId].nilai;
                    const bobot = komponenData.bobot;

                    assessmentsMap.get(assessorKey).komponen_nilai[komponenId] =
                      nilaiAssessor;
                    assessorTotal += (nilaiAssessor * bobot) / 100;
                  }
                });
              }

              assessmentsMap.get(assessorKey).total = assessorTotal;
            });
          }

          // Add form total to calculate average
          if (formData.total) {
            totalNilaiAkhir += formData.total;
            formCount++;
          }
        }
      });
    }

    // Calculate final average score
    const nilaiAkhir = formCount > 0 ? totalNilaiAkhir / formCount : 0;

    // Convert assessments map to array
    const assessments = Array.from(assessmentsMap.values());

    // If no assessments found, create a placeholder
    if (assessments.length === 0) {
      assessments.push({
        npm_penilai: "N/A",
        nama_penilai: "Tidak ada data penilai",
        komponen_nilai: {},
        total: 0,
      });
    }

    result.push({
      student: {
        ...student,
        nilai_akhir: nilaiAkhir,
      },
      assessments: assessments.sort((a, b) => {
        // Sort by form first, then by assessor
        if (a.formId !== b.formId) return a.formId - b.formId;
        return a.assessorId.localeCompare(b.assessorId);
      }),
    });
  });

  return result;
};

// Helper function untuk extract informasi komponen dari struktur data baru
const extractKomponenInfo = (studentsData, selectedForms = null) => {
  const komponenMap = new Map();

  studentsData.forEach((student) => {
    if (student.nilai_per_form) {
      Object.keys(student.nilai_per_form).forEach((formId) => {
        const formIdInt = parseInt(formId);

        if (!selectedForms || selectedForms.includes(formIdInt)) {
          const formData = student.nilai_per_form[formId];

          if (formData && formData.komponen) {
            Object.keys(formData.komponen).forEach((komponenId) => {
              const komponenData = formData.komponen[komponenId];
              if (komponenData && komponenData.nama_komponen) {
                komponenMap.set(komponenId, {
                  id: komponenId,
                  nama: komponenData.nama_komponen,
                  bobot: komponenData.bobot || 0,
                });
              }
            });
          }
        }
      });
    }
  });

  return Array.from(komponenMap.values()).sort(
    (a, b) => parseInt(a.id) - parseInt(b.id)
  );
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
