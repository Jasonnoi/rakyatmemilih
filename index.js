import express, { query } from "express";
import { fileURLToPath } from "url";
import  qrcode from "qrcode";
import path from "path";
import dbConnect from "./Database/connection.js";
import paginate from "express-paginate";
import pdf from "html-pdf";
import ejs from "ejs";
import { promisify } from "util";

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
    const idPengguna = 2; // blm terverifikasi
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
  try {
    const conn = await dbConnect();
    const query = `SELECT rw, SUM(status = 1) AS status_1_count, SUM(status IS NULL) AS status_0_count FROM view_verifikasi_pengguna GROUP BY rw;`;
    const getTabel1 = () => {
      return new Promise((resolve, reject) => {
        conn.query(query, (err, result) => {
          // Ubah variabel res menjadi result
          if (err) return reject(err);
          else return resolve(result);
        });
      });
    };
    const tabel1 = await getTabel1();
    res.render("admin/beranda", { tabel1, active: "beranda" });
    conn.release();
  } catch (err) {
    console.error(err.message);
  }
});
// Di sisi server (contoh menggunakan Express)
app.get("/admin/tabel1", async (req, res) => {
  try {
    const conn = await dbConnect();
    const query = `SELECT rw, SUM(status = 1) AS status_1_count, SUM(status IS NULL) AS status_0_count FROM view_verifikasi_pengguna GROUP BY rw;`;
    const getTabel1 = () => {
      return new Promise((resolve, reject) => {
        conn.query(query, (err, result) => {
          // Ubah variabel res menjadi result
          if (err) return reject(err);
          else return resolve(result);
        });
      });
    };
    const result = await getTabel1();
    const tabel1 = result;
    res.json(tabel1);
    conn.release();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/admin/tabel2", async (req, res) => {
  try {
    const conn = await dbConnect();
    const query = `SELECT id_RW, COUNT(no_tps) as jum_tps FROM view_rwtps GROUP BY id_RW`;
    const getTabel1 = () => {
      return new Promise((resolve, reject) => {
        conn.query(query, (err, result) => {
          // Ubah variabel res menjadi result
          if (err) return reject(err);
          else return resolve(result);
        });
      });
    };
    const result = await getTabel1();
    const tabel1 = result;
    res.json(tabel1);
    conn.release();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/admin/tabel3", async (req, res) => {
  try {
    const conn = await dbConnect();
    const query = `SELECT nama_TPS, COUNT(idSaksi) as jum_saksi FROM (SELECT * FROM saksi JOIN tps on saksi.id_tps = tps.id) AS tabel GROUP BY id_tps
`;
    const getTabel1 = () => {
      return new Promise((resolve, reject) => {
        conn.query(query, (err, result) => {
          // Ubah variabel res menjadi result
          if (err) return reject(err);
          else return resolve(result);
        });
      });
    };
    const result = await getTabel1();
    const tabel1 = result;
    res.json(tabel1);
    conn.release();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
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
    const selectRW = `SELECT * FROM rw `;

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

    const data_rw = () => {
      return new Promise((resolve, reject) => {
        conn.query(selectRW, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };
    const [totalTPS, dataRW, coun_rw, list_rw] = await Promise.all([
      getCountTPS(),
      getRW(),
      getCountRW(),
      data_rw(),
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
      list_rw,
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
app.post("/tambah-rw", async (req, res) => {
  try {
    const conn = await dbConnect();
    const query = `INSERT INTO rw VALUES(${req.body.rw}, 1)`;
    conn.query(query, (err, result) => {
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
    });
    conn.release();
  } catch (err) {
    res.status(500).send(err.message);
    console.error(err);
  }
});
app.post("/tambah-rt", async (req, res) => {
  try {
    const conn = await dbConnect();
    const query = `INSERT INTO rt VALUES(${req.body.rt}, ${req.body.RW})`;
    conn.query(query, (err, result) => {
      if (err) {
        console.error("Gagal Memasukan rt:", err);
        res.send(
          "<script>alert('Gagal Memasukan rt'); window.location.href='admin/kelola-rt';</script>"
        );
      } else {
        console.log("Berhasil Memasukan rt");
        res.send(
          "<script>alert('Berhasil Memasukan rt'); window.location.href='admin/kelola-rt';</script>"
        );
      }
    });
    conn.release();
  } catch (err) {
    res.status(500).send(err.message);
    console.error(err);
  }
});
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

// Cetak PDF

app.get("/cetak-pdf", async (req, res) => {
  try {
    const conn = await dbConnect();
    let selectData;

    const tabel = req.query.data;

    let query; // Mengubah conn.query menjadi versi promise

    let rows; // Dapatkan baris hasil query

    let renderedHtml;
    let template;
    if (tabel === "rt") {
      selectData = `SELECT * FROM rt`;
      query = promisify(conn.query).bind(conn);
      rows = await query(selectData);
      template = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
            }

            .header {
              padding: 20px;
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px solid black;
            }

            .logo {
              font-size: 24px;
              font-weight: bold;
            }

            .address {
              font-size: 14px;
            }
            .card-body h2{
              margin-left: 350px;
            }
            table {
              margin-left:100px;
              font-size: 13px;
              width: 80%;
              border-collapse: collapse;
            }

            table thead {
              background-color: rgb(197, 63, 59);
              color: white;
            }

            table th {
              padding: 12px;
              text-align: left;
            }

            table tbody tr:nth-child(odd) {
              background-color: rgba(197, 63, 59, 0.1);
            }
            table thead tr th:nth-child(odd) {
              color: black;
            }

            table tbody tr:hover {
              background-color: rgba(197, 63, 59, 0.2);
            }

            table tbody tr {
              font-weight: 700 !important;
              color: rgb(82, 78, 78);
            }
            td {
              padding: 12px;
            }

            table.dataTable thead th:first-child,
            table thead th:first-child {
              border-top-left-radius: 10px;
            }
            table.dataTable thead th:last-child,
            table thead th:last-child {
              border-top-right-radius: 10px;
            }

            .card-body {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Kelurahan Sangkan Hurip</div>
            <div class="address">
              Kantor Lurah Sangkan Hurip, Alamat Jalan Cibinong No 5 Kabupaten Bandung
            </div>
          </div>
          <div class="card-body">
            <h2>Hasil Tabel Cetak Data</h2>
            <table>
              <thead>
                <tr>
                  <th>Nomor</th>
                  <th>Kelurahan</th>
                  <th>Nomor RW</th>
                  <th>Nomor RT</th>
                </tr>
              </thead>
              <tbody>
                <% let i = 1; %>
              <% for(const row of results) { %>
                <tr>
                  <td><%= i %></td>
                  <td>Sangkanhurip</td>
                  <td><%= "RW 0" + row.no_rw %></td>
                  <td><%= "RT 0" + row.no %></td>
                </tr>
                <% i++; %>
              <% } %>
              </tbody>
            </table>
          </div>
          <div class="footer">Tanda tangan: Adrian Jason</div>
        </body>
      </html>
      `;
    } else if (tabel === "rw") {
      selectData = `SELECT * FROM rw`;
      query = promisify(conn.query).bind(conn);
      rows = await query(selectData);
      template = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
            }

            .header {
              padding: 20px;
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px solid black;
            }

            .logo {
              font-size: 24px;
              font-weight: bold;
            }

            .address {
              font-size: 14px;
            }
            .card-body h2{
              margin-left: 350px;
            }
            table {
              margin-left:100px;
              font-size: 13px;
              width: 80%;
              border-collapse: collapse;
            }

            table thead {
              background-color: rgb(197, 63, 59);
              color: white;
            }

            table th {
              padding: 12px;
              text-align: left;
            }

            table tbody tr:nth-child(odd) {
              background-color: rgba(197, 63, 59, 0.1);
            }
            table thead tr th:nth-child(odd) {
              color: black;
            }

            table tbody tr:hover {
              background-color: rgba(197, 63, 59, 0.2);
            }

            table tbody tr {
              font-weight: 700 !important;
              color: rgb(82, 78, 78);
            }
            td {
              padding: 12px;
            }

            table.dataTable thead th:first-child,
            table thead th:first-child {
              border-top-left-radius: 10px;
            }
            table.dataTable thead th:last-child,
            table thead th:last-child {
              border-top-right-radius: 10px;
            }

            .card-body {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Kelurahan Sangkan Hurip</div>
            <div class="address">
              Kantor Lurah Sangkan Hurip, Alamat Jalan Cibinong No 5 Kabupaten Bandung
            </div>
          </div>
          <div class="card-body">
            <h2>Hasil Tabel Cetak Data</h2>
          <table>
            <thead>
              <tr>
                <th>Nomor</th>
                <th>Kelurahan</th>
                <th>Nomor RW</th>
          
              </tr>
            </thead>
            <tbody>
              <% let i = 0; %>
              <% for(const row of results) { %>
                <tr>
                  <td><%= i + 1 %></td>
                  <td>Sangkanhurip</td>
                  <td><%= "RW 0" + row.no %></td>
                  
                </tr>
                <% i++; %>
              <% } %>
            </tbody>
          </table>
          </div>
          <div class="footer">Tanda tangan: Adrian Jason</div>
        </body>
      </html>
      `;
    } else if (tabel === "tps") {
      selectData = `SELECT * FROM tps`;
      query = promisify(conn.query).bind(conn);
      rows = await query(selectData);
      template = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
            }

            .header {
              padding: 20px;
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px solid black;
            }

            .logo {
              font-size: 24px;
              font-weight: bold;
            }

            .address {
              font-size: 14px;
            }
            .card-body h2{
              margin-left: 350px;
            }
            table {
              margin-left:100px;
              font-size: 13px;
              width: 80%;
              border-collapse: collapse;
            }

            table thead {
              background-color: rgb(197, 63, 59);
              color: white;
            }

            table th {
              padding: 12px;
              text-align: left;
            }

            table tbody tr:nth-child(odd) {
              background-color: rgba(197, 63, 59, 0.1);
            }
            table thead tr th:nth-child(odd) {
              color: black;
            }

            table tbody tr:hover {
              background-color: rgba(197, 63, 59, 0.2);
            }

            table tbody tr {
              font-weight: 700 !important;
              color: rgb(82, 78, 78);
            }
            td {
              padding: 12px;
            }

            table.dataTable thead th:first-child,
            table thead th:first-child {
              border-top-left-radius: 10px;
            }
            table.dataTable thead th:last-child,
            table thead th:last-child {
              border-top-right-radius: 10px;
            }

            .card-body {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Kelurahan Sangkan Hurip</div>
            <div class="address">
              Kantor Lurah Sangkan Hurip, Alamat Jalan Cibinong No 5 Kabupaten Bandung
            </div>
          </div>
          <div class="card-body">
            <h2>Hasil Tabel Cetak Data</h2>
             <table>
            <thead>
              <tr>
 
                <th>Nomor</th>
                <th>Nama TPS</th>
                <th>Nomor TPS</th>
                <th>RW TPS</th>
                <th>Kapasitas TPS</th>
              </tr>
            </thead>
            <tbody>
              <% let i = 1; %>
              <% for(const row of results) { %>
                <tr>
                  <td><%= i %></td>
                  <td><%= row.nama_TPS %></td>
                  <td><%= "TPS 0" + row.no_tps %></td>
                  <td><%= "RW " + row.id_RW %></td>
                  <td><%= row.kapasitas  %></td>
                </tr>
                <% i++; %>
              <% } %>
            </tbody>
          </table>
          </div>
          <div class="footer">Tanda tangan: Adrian Jason</div>
        </body>
      </html>
      `;
    } else {
      selectData = `SELECT * FROM view_verifikasi_pengguna`;
      query = promisify(conn.query).bind(conn);
      rows = await query(selectData);
      template = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
            }

            .header {
              padding: 20px;
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px solid black;
            }

            .logo {
              font-size: 24px;
              font-weight: bold;
            }

            .address {
              font-size: 14px;
            }
            .card-body h2{
              margin-left: 350px;
            }
            table {
              margin-left:100px;
              font-size: 13px;
              width: 80%;
              border-collapse: collapse;
            }

            table thead {
              background-color: rgb(197, 63, 59);
              color: white;
            }

            table th {
              padding: 12px;
              text-align: left;
            }

            table tbody tr:nth-child(odd) {
              background-color: rgba(197, 63, 59, 0.1);
            }
            table thead tr th:nth-child(odd) {
              color: black;
            }

            table tbody tr:hover {
              background-color: rgba(197, 63, 59, 0.2);
            }

            table tbody tr {
              font-weight: 700 !important;
              color: rgb(82, 78, 78);
            }
            td {
              padding: 12px;
            }

            table.dataTable thead th:first-child,
            table thead th:first-child {
              border-top-left-radius: 10px;
            }
            table.dataTable thead th:last-child,
            table thead th:last-child {
              border-top-right-radius: 10px;
            }

            .card-body {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Kelurahan Sangkan Hurip</div>
            <div class="address">
              Kantor Lurah Sangkan Hurip, Alamat Jalan Cibinong No 5 Kabupaten Bandung
            </div>
          </div>
          <div class="card-body">
            <h2>Hasil Tabel Cetak Data</h2>
             <table>
            <thead>
              <tr>
                <th>Nomor</th>
                <th>Nama</th>
                <th>NIK</th>
                <th>RW</th>
                <th>RT</th>
                <th>TPS</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <% let i = 1; %>
              <% for(const row of results) { %>
                <tr>
                  <td><%= i %></td>
                  <td><%= row.nama %></td>
                  <td><%= row.NIK %></td>
                  <td><%= "RW " + row.rw %></td>
                  <td><%= "RT " + row.rt %></td>
                  <td>
                    <% if (row.id_tps == null) { %>
                      Data Belum di Verifikasi
                    <% } else { %>
                      <%= "TPS " + row.id_tps %>
                    <% } %>
                  </td>
                  <td>
                    <% if (row.status == null) { %>
                      <p style="color:red;">Belum Verifikasi</p>
                    <% } else { %>
                       <p style="color:green;">Sudah Verifikasi</p>
                    <% } %>
                  </td>
                </tr>
                <% i++; %>
              <% } %>
            </tbody>
          </table>
          </div>
          <div class="footer">Tanda tangan: Adrian Jason</div>
        </body>
      </html>
      `;
    }

    renderedHtml = ejs.render(template, { results: rows });

    pdf.create(renderedHtml).toStream((err, stream) => {
      if (err) {
        res.status(500).send("Error generating PDF");
      } else {
        res.setHeader("Content-Type", "application/pdf");
        stream.pipe(res);
      }
    });

    conn.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Database connection error");
  }
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

// Register User
app.post("/register-data", async (req, res) => {});

//server listening
app.listen(port, () => {
  console.log("ready, dengan port: " + port);
});
