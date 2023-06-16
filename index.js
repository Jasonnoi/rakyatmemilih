import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import dbConnect from "./Database/connection.js";
import paginate from "express-paginate";


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
app.get("/admin/tps-by-rw/:rw", async (req, res) => {
  try {
    const conn = await dbConnect();
    const rw = req.params.rw;
    // Query untuk mendapatkan TPS berdasarkan RW
    const query = `SELECT * FROM tps WHERE id_RW = ${rw} AND kapasitas  > 0 `;
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

app.get("/admin/kelola-tps", async (req, res) => {
  try {
    const conn = await dbConnect();
    const queryTPS = `SELECT * FROM tps `;
    const getData = () => {
      return new Promise((resolve, reject) => {
        conn.query(queryTPS, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };
    const queryRW = `SELECT * FROM rw`;
    const dataRW = () => {
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

    const dataTPS = await getData();
    const getRW = await dataRW();
    res.render("admin/kelolatps", { getRW, dataTPS, active: "tps" });
    conn.release();
  } catch (err) {
    res.status(500).send("Database connection error");
  }
});
app.get("/admin/kelola-rw", async (req, res) => {
  try {
    const conn = await dbConnect();
    const selectDataRW = `SELECT * FROM rw`;
    const countRW = `SELECT count(no) as jumRW FROM rw`;
    const countTPS = `SELECT count(no) as totTPS FROM view_rwtps GROUP BY no `;

    const getRW = () => {
      return new Promise((resolve, reject) => {
        conn.query(selectDataRW, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    const getCountRW = () => {
      return new Promise((resolve, reject) => {
        conn.query(countRW, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
      });
    };

    const getCountTPS = () => {
      return new Promise((resolve, reject) => {
        conn.query(countTPS, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    const totalTPS = await getCountTPS();
    const dataRW = await getRW();
    const coun_rw = await getCountRW();

    res.render("admin/kelolarw", {
      totalTPS,
      dataRW,
      coun_rw,
      active: "kelolarw",
    });
    conn.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Database connection error");
  }
});
app.get("/admin/kelola-rt", paginate.middleware(10, 50), async (req, res) => {
  try {
    const conn = await dbConnect();
    const selectDataRW = `SELECT * FROM rt `;

    const countRW = `SELECT count(no) as jumRW FROM rt`;
    const countTPS = `SELECT count(no) as totTPS FROM view_rwtps GROUP BY no `;

    // Mendapatkan nilai pencarian dari URL
    const searchQuery = req.query.querySearch;
    let selectDataRWWithSearch;

    if (searchQuery) {
      if (searchQuery.toUpperCase().includes("RW")) {
        const modified = searchQuery.substring(4);
        console.log(modified);
        selectDataRWWithSearch = `
          ${selectDataRW}
          WHERE no_rw LIKE '%${modified}%'
        `;
      } else if (searchQuery.toUpperCase().includes("RT")) {
        const modified = searchQuery.substring(4);
        selectDataRWWithSearch = `
          ${selectDataRW}
          WHERE no LIKE '%${modified}%'
        `;
      } else {
        const modified = searchQuery.substring(4);
        selectDataRWWithSearch = `
          ${selectDataRW}
          WHERE no LIKE '%${modified}%'
            OR no_rw LIKE '%${modified}%'
        `;
      }
    } else {
      selectDataRWWithSearch = selectDataRW;
    }
    let getRW;

    if (typeof searchQuery === "undefined") {
      getRW = () => {
        return new Promise((resolve, reject) => {
          conn.query(selectDataRW, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      };
    } else {
      getRW = () => {
        return new Promise((resolve, reject) => {
          conn.query(selectDataRWWithSearch, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      };
    }

    // Menggabungkan pencarian ke dalam query SQL

    const getCountRW = () => {
      return new Promise((resolve, reject) => {
        conn.query(countRW, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
      });
    };

    const getCountTPS = () => {
      return new Promise((resolve, reject) => {
        conn.query(countTPS, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    const [totalTPS, dataRW, coun_rw] = await Promise.all([
      getCountTPS(),
      getRW(),
      getCountRW(),
    ]);

    const itemCount = dataRW.length;
    const limit = 10; // Set nilai limit menjadi 10
    const pageCount = Math.ceil(itemCount / limit);
    const currentPage = parseInt(req.query.page) || 1;
    const offset = (currentPage - 1) * limit; // Hitung offset berdasarkan halaman saat ini
    const limitedDataRW = dataRW.slice(offset, offset + limit); // Batasi data yang ditampilkan sesuai limit dan offset
    const pages = paginate.getArrayPages(req)(3, pageCount, currentPage);
    console.log(pageCount, currentPage, itemCount, limit);
    res.render("admin/kelolart", {
      totalTPS,
      dataRW: limitedDataRW, // Gunakan data yang telah dibatasi sesuai limit
      coun_rw,
      active: "kelolart",
      pageCount,
      itemCount,
      pages,
      current: currentPage,
    });

    conn.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Database connection error");
  }
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
app.post('/tambah-rw', async (req, res) =>{
  try{
    const conn = await dbConnect();
    const query = `INSERT INTO rw VALUES(${req.body.rw}, 1)`;
    conn.query(query, (err, result) =>{
      if (err) {
        console.error("Gagal Memasukan rw:", err);
        res.send(
          "<script>alert('Gagal Memasukan rw'); window.location.href='admin/kelola-rw';</script>"
        );
      } else {
        console.log("Berhasil Memasukan rw");
        res.send(
          "<script>alert('Berhasil Memasukan rw'); window.location.href='admin/kelola-rw';</script>"
        );
      }
    })
    conn.release();

  }catch(err){
    res.status(500).send(err.message);
    console.error(err);
  }
})
app.post("/verif-data", async (req, res) => {
  const conn = await dbConnect();
  const idPemilih = req.body.idPemilih;
  const tps = req.body.tps;
  console.log(tps);
  // Mengubah status menjadi 'Ditolak' dan mengupdate TPS
  const query = `UPDATE tabel_verifikasi SET status = 1 , id_tps = ${tps}  WHERE id_pengguna = ${idPemilih}`;
  const perintah = `UPDATE tps set kapasitas = kapasitas - 1 WHERE id = ${tps}`;

  conn.query(query, (err, result) => {
    if (err) {
      console.error("Gagal verifikasi data:", err);
      res.send(
        "<script>alert('Gagal verifikasi data'); window.location.href='admin/verifikasi-data-pemilih';</script>"
      );
    } else {
      conn.query(perintah, (err, haha) => {
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
      });
    }
    conn.release();
  });
});

app.post("/tambah-tps", async (req, res) => {
  const conn = await dbConnect();
  const kapasitas = req.body.Kapasitas;
  const no_tps = req.body.nomor;
  const nama_TPS = req.body.nama;
  const id_RW = req.body.RW;
  const query = `INSERT INTO tps(id, kapasitas, no_tps, nama_TPS, id_RW) VALUES ('','${kapasitas}', '${no_tps}', '${nama_TPS}', '${id_RW}')`;
  conn.query(query, (err, result) => {
    if (err) {
      console.error("Gagal Tambah TPS:", err);
      res.send(
        "<script>alert('Gagal Tambah TPS'); window.location.href='admin/kelola-tps';</script>"
      );
    } else {
      console.log("Berhasil Tambah TPS");
      res.send(
        "<script>alert('Berhasil Tambah TPS'); window.location.href='admin/kelola-tps';</script>"
      );
    }
  });
});
//routing untuk lurah
app.get("/lurah/", (req, res) => {
  res.render("lurah/beranda", { active: "beranda" });
});
// app.get("/lurah/verifikasi-data-pemilih", (req, res) => {
//   res.render("lurah/pilihsaksi", { active: "verifikasi" });
// });
// app.get("/admin/kelola-tps", (req, res) => {
//   res.render("admin/kelolatps", { active: "tps" });
// });
// app.get("/admin/kelola-rw", (req, res) => {
//   res.render("admin/kelolarw", { active: "kelolarw" });
// });

//server listening
app.listen(port, () => {
  console.log("ready, dengan port: " + port);
});
