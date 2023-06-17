import mysql from "mysql";

const conn = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "rakyatmemilih",
});

const dbConnect = () => {
  return new Promise((resolve, reject) => {
    conn.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
};

export default dbConnect;
