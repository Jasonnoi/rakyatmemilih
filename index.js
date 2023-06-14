import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import dbConnect from "./Database/connection.js";

const port = 3000;
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

//routing untuk admin
app.get("/admin/", async (req, res) => {
  res.render("admin/beranda", { active: "beranda" });
});

app.get("/admin/verifikasi-data-pemilih", async (req, res) => {
  try {
    const conn = await dbConnect();
    let query = `SELECT * FROM view_verifikasi_pengguna`;
    const hashedStatus = req.query.jenis_data_pemilih;

    // Cek apakah parameter status ada dalam URL query
    if (decodeURIComponent(hashedStatus) === "Pemilih Sudah Verifikasi") {
      query = `SELECT * FROM view_verifikasi_pengguna WHERE status = 1`;
    } else if (
      decodeURIComponent(hashedStatus) === "Pemilih Belum Verifikasi"
    ) {
      query = `SELECT * FROM view_verifikasi_pengguna WHERE status is NULL`;
    }

    conn.query(query, (err, results) => {
      const query2 = `SELECT COUNT(id) as totalData FROM view_verifikasi_pengguna`;
      conn.query(query2, (err, totalPemilih) => {
        const query3 = `SELECT COUNT(id) as totalData FROM view_verifikasi_pengguna GROUP BY status`;
        conn.query(query3, (err, total) => {
          if (err) {
            console.error("Tidak dapat mengeksekusi query:", err);
            res.status(500).send("Tidak dapat mengeksekusi query");
          } else {
            res.render("admin/verifdata", {
              total,
              totalPemilih,
              results,
              active: "verifikasi",
            });
          }
        });
      });
    });

    conn.release();
  } catch (err) {
    res.status(500).send("Database connection error");
  }
});

app.get("/admin/kelola-tps", (req, res) => {
  res.render("admin/kelolatps", { active: "tps" });
});
app.get("/admin/kelola-rw", (req, res) => {
  res.render("admin/kelolarw", { active: "kelolarw" });
});
// Pozt Untuk admin
app.post("/hapus-data", async (req, res) => {
  const conn = await dbConnect();
  const idPemilih = req.body.idPemilih;
  const query = `DELETE FROM pengguna WHERE id = ${idPemilih}`;
  conn.query(query, (err, result) => {
    if (err) {
      console.error("Gagal menghapus data:", err);
      res.send(
        "<script>alert('Gagal menghapus data'); window.location.href='admin/verifikasi-data-pemilih';</script>"
      );
    } else {
      const query2 = `DELETE FROM tabel_verifikasi WHERE id_pengguna =  ${idPemilih}`;
      conn.query(query2, (err, resu) => {
        if (err) {
          console.error("Gagal menghapus data:", err);
          res.send(
            "<script>alert('Gagal menghapus data'); window.location.href='admin/verifikasi-data-pemilih';</script>"
          );
        } else {
          console.log("Berhasil menghapus data");
          res.send(
            "<script>alert('Berhasil menghapus data'); window.location.href='admin/verifikasi-data-pemilih';</script>"
          );
        }
      });
    }
    conn.release();
  });
});

app.post("/verif-data", async (req, res) => {
  const conn = await dbConnect();
  const idPemilih = req.body.idPemilih;
  const tps = req.body.tps;
  console.log(tps);
  // Mengubah status menjadi 'Ditolak' dan mengupdate TPS
  const query = `UPDATE tabel_verifikasi SET status = 1 , id_tps = ${tps}  WHERE id_pengguna = ${idPemilih}`;

  conn.query(query, (err, result) => {
    if (err) {
      console.error("Gagal verifikasi data:", err);
      res.send(
        "<script>alert('Gagal verifikasi data'); window.location.href='admin/verifikasi-data-pemilih';</script>"
      );
    } else {
      console.log("Berhasil verifikasi data");
      res.send(
        "<script>alert('Berhasil verifikasi data'); window.location.href='admin/verifikasi-data-pemilih';</script>"
      );
    }
    conn.release();
  });
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
