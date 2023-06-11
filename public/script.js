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

console.log("halo");
