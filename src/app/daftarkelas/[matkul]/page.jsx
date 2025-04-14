import React from "react";
import Layout from "../../../components/Layout";
import DaftarKelompok from "../../../components/UI/DaftarKelompok";

const page = async ({ params }) => {
  const { matkul } = await params;
  const split = matkul.split("-");
  const id_mk = split.pop();
  const kelas = split.pop();
  const nama_matkul = split.join(" ");

  return (
    <Layout>
      <DaftarKelompok matkul={nama_matkul} kelas={kelas} id_mk={id_mk} />
    </Layout>
  );
};

export default page;
