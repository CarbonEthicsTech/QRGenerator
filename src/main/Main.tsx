import React, { useState } from "react";
import * as xlsx from 'xlsx';
import axios from "axios";

export default function Main(){

    const [QRs, setQRs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    function handleFile(e) {
        e.preventDefault()
        setLoading(true)
        if (e.target.files) {
            const files = e.target.files
            const reader = new FileReader();
            if (reader.readAsBinaryString) {
                reader.onload = (e) => {
                    processExcel(reader.result);
                };
                reader.readAsBinaryString(files[0]);
            }
        } else {
            setLoading(false)
        }
    }

    function processExcel(data){
        const workbook = xlsx.read(data, {type: 'binary'});
        const firstSheet = workbook.SheetNames[0];
        const excelRows = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheet]);

        let results: any[] = [];
        let promises: Promise<void>[] = [];

        excelRows.map((row) => {
            const processRow = createAPI(row, function(res){
                results.push(res.data)
            })

            promises.push(processRow)
        })

        Promise.all(promises).then((res) => {
            setQRs(results);
            setLoading(false)
        })
    }

    function createAPI(row, callback){
        return axios.post("https://me-qr.com/api/qr/create/", {
            "token": process.env.REACT_APP_MEQR_API_KEY,
            "qrType": 1,
            "title": row.Title,
            "service": "api",
            "format": "json",
            "qrOptions": {
              "size": 300,
              "pattern": "square",
              "patternColor": "#0A3E6D",
              "patternBackground": "#ffffff",
              "cornetsInterior": "dot",
              "cornetsInteriorColor": "#0A3E6D",
              "cornetsOuter": "extra-rounded",
              "cornetsOuterColor": "#0A3E6D",
              "logotype": "https://i.ibb.co/hZLwzHk/Logomark-Blue.png",
              "logotypeSize": 0.5,
              "logotypeHideBackground": true,
              "logotypeMargin": 5
            },
            "qrFieldsData": {
              "link": row.URL
            }
        })
        .then((response) => {
            callback(response)
        })
    }

    return(
        <>
            <form>
                <p>Upload Excel File</p>
                <input type="file" onChange={handleFile}></input>
                {loading && <p> Processing... </p>}
                {QRs.length > 0 && (
                    QRs.map((QR) => (
                        <>
                            <p> {QR.name} </p>
                            <img src={QR.qrUrl} />
                        </>
                    ))
                )}
            </form>
        </>
    )
}