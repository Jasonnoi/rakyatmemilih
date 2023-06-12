import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const port = 8080;
const app = express();
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

//set view engine
app.set("view engine", "ejs");

// Mengatur direktori public sebagai direktori statis
app.use(express.static(path.join(dirname, "public")));

//middleware express.urlencoded() untuk menguraikan data yang dikirim melalui form
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// Routing untuk pengguna
app.get("/pengguna/", (req, res) => {
  res.render("pengguna/beranda", { active: "beranda" });
});

app.get("/pengguna/verif-data-pengguna", (req, res) => {
  res.render("pengguna/verifikasiData", { active: "verifikasiData" });
});

app.get("/pengguna/edit-akun", (req, res) => {
  res.render("pengguna/editAkun", { active: "editAkun" });
});

app.get("/pengguna/kartu-pemilu", (req, res) => {
  res.render("pengguna/kartuPemilu", { active: "kartuPemilu", activeNav: "kartu"});
});

app.get("/pengguna/kartu-pemiluB", (req, res) => {
  res.render("pengguna/kartuPemilu", { active: "kartuPemilu", activeNav: "barcode"});
});




//routing untuk admin
app.get("/admin/", (req, res) => {
  res.render("admin/beranda", { active: "beranda" });
});

app.get("/admin/verifikasi-data-pemilih", (req, res) => {
  res.render("admin/verifdata", { active: "verifikasi" });
});
app.get("/admin/kelola-tps", (req, res) => {
  res.render("admin/kelolatps", { active: "tps" });
});
app.get("/admin/kelola-rw", (req, res) => {
  res.render("admin/kelolarw", { active: "kelolarw" });
});

//routing untuk lurah
app.get("/lurah/", (req, res) => {
  res.render("lurah/beranda", { active: "beranda" });
});
app.get("/admin/verifikasi-data-pemilih", (req, res) => {
  res.render("lurah/pilihsaksi", { active: "verifikasi" });
});
app.get("/admin/kelola-tps", (req, res) => {
  res.render("admin/kelolatps", { active: "tps" });
});
app.get("/admin/kelola-rw", (req, res) => {
  res.render("admin/kelolarw", { active: "kelolarw" });
});

//server listening
app.listen(port, () => {
  console.log("ready, dengan port: " + port);
});
