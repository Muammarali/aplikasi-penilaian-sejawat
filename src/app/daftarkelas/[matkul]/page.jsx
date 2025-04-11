import React from "react";
import Layout from "../../../components/Layout";
import DaftarKelompok from "../../../components/UI/DaftarKelompok";

const page = async ({ params }) => {
  const { matkul } = await params;

  return (
    <Layout>
      <DaftarKelompok matkul={matkul} />
    </Layout>
  );
};

export default page;
