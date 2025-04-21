"use client";
import React from "react";
import Layout from "../../Layout";
import { useSession } from "next-auth/react";
import DaftarKelas from "../DaftarKelas";
import DaftarKelasDosen from "../DosenPage/MataKuliah";

const MataKuliahContainer = () => {
  const { data: session } = useSession();
  return (
    <Layout>
      {session?.user?.role === "Mahasiswa" ? (
        <DaftarKelas />
      ) : (
        <DaftarKelasDosen />
      )}
    </Layout>
  );
};

export default MataKuliahContainer;
