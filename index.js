import express, { query } from "express";
import { fileURLToPath } from "url";
import  qrcode from "qrcode";
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
app.get("/pengguna/", async (req, res) => {
  try {
    const conn = await dbConnect();
    const idPengguna = 2; // blm terverifikasi
    const queryId = `SELECT * FROM view_verifikasi_pengguna WHERE id = ${idPengguna}`;

    const getData = () => {
      return new Promise((resolve, reject) => {
        conn.query(queryId, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
      });
    };

    const resultPenggunaId = await getData();

    res.render("pengguna/beranda", {
      resultPenggunaId,
      active: "beranda",
    });

    conn.release();

  } catch (error) {
    res.status(500).send("Database connection error");
  }
});

app.get("/pengguna/verif-data-pengguna", async (req, res) => {
  try {
    const conn = await dbConnect();
    const idPengguna = 1; // blm terverifikasi
    const queryId = `SELECT * FROM view_outer_verifikasi WHERE id = ${idPengguna}`;

    const getData = () => {
      return new Promise((resolve, reject) => {
        conn.query(queryId, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
      });
    };

    const resultPenggunaId = await getData();
    // membuat format date
    const dateStr = resultPenggunaId.tgl_lahir;
    const dateObj = new Date(dateStr);

    const tahun = dateObj.getFullYear();
    const bulan = String(dateObj.getMonth() + 1).padStart(2, '0');
    const hari = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${tahun}-${bulan}-${hari}`;

    const idKelurahan = resultPenggunaId.id_kelurahan;
    const queryRW = `SELECT * FROM rw WHERE id_kelurahan = ${idKelurahan}`;
    const getRW = () => {
      return new Promise((resolve, reject) => {
        conn.query(queryRW, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    const resultRW = await getRW();


    res.render("pengguna/verifikasiData", {
      resultPenggunaId,
      formattedDate,
      resultRW,
      active: "verifikasiData",
    });

    conn.release();
  } catch (err) {
    res.status(500).send("Database connection error");
  }
});

app.get("/pengguna/verif-data-pengguna/select/:rw", async (req, res) => {
  try {
    const conn = await dbConnect();
    const idRw = req.params.rw;
    // Query untuk mendapatkan TPS berdasarkan RW
    const query = `SELECT * FROM rt WHERE no_RW = ${idRw}`;
    conn.query(query, (err, results) => {
      if (err) {
        console.error("Tidak dapat mengeksekusi query TPS:", err);
        res.status(500).send("Tidak dapat mengeksekusi query TPS");
        return;
      }
      res.json(results);
    });

    conn.release();
  } catch (err) {
    res.status(500).send("Database connection error");
  }
});

app.post("/pengguna/verif-data-pengguna", async (req,res) => {
  try {
    const conn = await dbConnect();
    const isiForm = req.body;

    //membuat input waktu sekarang
    const now = new Date(); // Membuat objek Date baru yang mewakili waktu sekarang
    const options = { timeZone: 'Asia/Jakarta' };
    const jakartaDate = now.toLocaleString('en-US', options).split(',')[0]; // Mendapatkan tanggal dalam format lokal Jakarta

    // Ubah format tanggal menjadi "YYYY-MM-DD"
    const [month, day, year] = jakartaDate.split('/');
    const mysqlDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    //update query di tabel pengguna
    const queryUpdate = `UPDATE pengguna SET 
                          NIK = '${isiForm.nik}',
                          nama = '${isiForm.nama}',
                          tgl_lahir = '${isiForm.tgl_lahir}',
                          kelamin = '${isiForm.kelamin}',
                          no_hp = '${isiForm.noTelepon}',
                          email = '${isiForm.email}',
                          rw = '${isiForm.RW}',
                          rt = '${isiForm.RT}' WHERE id = '${isiForm.id}'`;

    conn.query(queryUpdate, (err, result) => {
      if(err){
        console.error("Tidak dapat mengeksekusi query update:", err);
        res.send(
          "<script>alert('Gagal verifikasi data'); window.location.href='/pengguna/verif-data-pengguna';</script>"
        );
      }else{
        const queryInsert = `INSERT INTO tabel_verifikasi 
                            (id_pengguna, foto_ktp, tanggal) VALUES
                            (${isiForm.id},  '${isiForm.fotoKtp}', '${mysqlDate}')`;
        
        conn.query(queryInsert, (err,resultInsert) => {
          if(err){
            console.error("Tidak dapat mengeksekusi query insert:", err);
            res.send(
              "<script>alert('Gagal verifikasi data'); window.location.href='/pengguna/verif-data-pengguna';</script>"
            );
          }else{
            res.send(
              "<script>alert('Berhasil verifikasi data'); window.location.href='/pengguna/verif-data-pengguna';</script>"
            );
          }
        });
      }
    });
    conn.release();
  } catch (err) {
    res.status(500).send("Database connection error");
  }
});

app.get("/pengguna/edit-akun", async (req, res) => {
  try {
    const conn = await dbConnect();
    const idPengguna = 2; // blm terverifikasi
    const queryId = `SELECT * FROM view_verifikasi_pengguna WHERE id = ${idPengguna}`;

    const getData = () => {
      return new Promise((resolve, reject) => {
        conn.query(queryId, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
      });
    };

    const resultPenggunaId = await getData();
    // membuat format date
    const dateStr = resultPenggunaId.tgl_lahir;
    const dateObj = new Date(dateStr);

    const tahun = dateObj.getFullYear();
    const bulan = String(dateObj.getMonth() + 1).padStart(2, '0');
    const hari = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${tahun}-${bulan}-${hari}`;


    res.render("pengguna/editAkun", {
      resultPenggunaId,
      formattedDate,
      active: "editAkun",
    });

    conn.release();
  } catch (err) {
    res.status(500).send("Database connection error");
  }
});

app.post("/pengguna/edit-akun", async (req, res) => {
  try {
    const conn = await dbConnect();
    const idPengguna = 2; // blm terverifikasi
    const isiForm = req.body;
    //update query di tabel pengguna
    const queryUpdate = `UPDATE pengguna SET 
                          nama = '${isiForm.nama}',
                          tgl_lahir = '${isiForm.tgl_lahir}',
                          kelamin = '${isiForm.kelamin}',
                          no_hp = '${isiForm.noTelepon}',
                          email = '${isiForm.email}' WHERE id = ${idPengguna}`;

    conn.query(queryUpdate, (err, result) => {
      if(err){
        console.error("Tidak dapat mengeksekusi query update:", err);
        res.send(
          "<script>alert('Data tidak berhasil di simpan'); window.location.href='/pengguna/edit-akun';</script>"
        );
      }else{
        res.send(
          "<script>alert('Data berhasil di simpan'); window.location.href='/pengguna/edit-akun';</script>"
        );
      }
    });
    conn.release();
  } catch (err) {
    res.status(500).send("Database connection error");
  }
});

app.get("/pengguna/kartu-pemilu", async (req, res) => {
  try {
    const conn = await dbConnect();
    const idPengguna = 2; // blm terverifikasi
    const queryId = `SELECT * 
                      FROM view_verifikasi_pengguna 
                        LEFT OUTER JOIN saksi 
                        ON view_verifikasi_pengguna.id = saksi.idPengguna 
                        LEFT OUTER JOIN tps 
                        ON saksi.id_tps = tps.id 
                        WHERE view_verifikasi_pengguna.id = ${idPengguna}`;

    const getData = () => {
      return new Promise((resolve, reject) => {
        conn.query(queryId, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
      });
    };

    const resultPenggunaId = await getData();

    res.render("pengguna/kartuPemilu", {
      resultPenggunaId,
      active: "kartuPemilu",
    });

    conn.release();

  } catch (error) {
    res.status(500).send("Database connection error");
  }
});

app.get("/pengguna/barcode-pemilu", async (req, res) => {
  try {
    const conn = await dbConnect();
    const idPengguna = 2; // blm terverifikasi
    const queryId = `SELECT * FROM view_verifikasi_pengguna WHERE id = ${idPengguna}`;

    const getData = () => {
      return new Promise((resolve, reject) => {
        conn.query(queryId, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
      });
    };

    const resultPenggunaId = await getData();

    //generate qr berdasarkan NIK
    qrcode.toDataURL(resultPenggunaId.NIK, (err, src) => {
      res.render("pengguna/kartuPemilu", {
        resultPenggunaId,
        active: "barcodePemilu",
        qr_code: src,
      });
    });

    conn.release();

  } catch (error) {
    res.status(500).send("Database connection error");
  }
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
      if (err) {
        console.error("Tidak dapat mengeksekusi query:", err);
        res.status(500).send("Tidak dapat mengeksekusi query");
      } else {
        const query2 = `SELECT COUNT(id) as totalData FROM view_verifikasi_pengguna`;
        conn.query(query2, (err, totalPemilih) => {
          if (err) {
            console.error("Tidak dapat mengeksekusi query:", err);
            res.status(500).send("Tidak dapat mengeksekusi query");
          } else {
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
          }
        });
      }
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
