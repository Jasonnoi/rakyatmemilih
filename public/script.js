$(document).ready(function () {
  $("#example").DataTable();
});
const verif_user_data = document.getElementById("verif-user-data");
verif_user_data.addEventListener("click", () => {
  Swal.fire({
    title: "Error!",
    text: "Do you want to continue",
    icon: "error",
    confirmButtonText: "Cool",
  });
});

function redirectToVerifikasiData() {
  const jenis = encodeURIComponent("Pemilih Sudah Verifikasi");

  window.location.href =
    "/admin/verifikasi-data-pemilih?jenis_data_pemilih=" + jenis;
}

function redirectToDataLengkap() {
  window.location.href = "/admin/verifikasi-data-pemilih";
}
function redirectToDataTidakLengkap() {
  const jenis = encodeURIComponent("Pemilih Belum Verifikasi");

  window.location.href =
    "/admin/verifikasi-data-pemilih?jenis_data_pemilih=" + jenis;
}

console.log("halo");
