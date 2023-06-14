$(document).ready(function () {
  $("#example").DataTable();
});

console.log("halo");

const menu_btn = document.querySelector(".hamburger");
const sidebar = document.querySelector(".sidebar");

menu_btn.addEventListener("click", function () {
  console.log("hello");
  menu_btn.classList.toggle("is-active");
  sidebar.classList.toggle("is-active");
});
