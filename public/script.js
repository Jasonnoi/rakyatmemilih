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
function cetakPDF_RT() {
  window.open("/cetak-pdf?data=rt");
}

function cetakPDF_RW() {
  window.open("/cetak-pdf?data=rw");
}

function cetakPDF_TPS() {
  window.open("/cetak-pdf?data=tps");
}
function cetakPDF_pengguna() {
  window.open("/cetak-pdf?data=pengguna");
}



console.log("halo");
