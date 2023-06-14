$(document).ready(function () {
  $("#example").DataTable();
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
