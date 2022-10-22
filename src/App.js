import "./App.css";
import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { Multipart } from "./multipart";

function processData(res) {
  let contentType = res.headers["content-type"];
  let parts = contentType.split("boundary=");
  let boundary = parts[1];
  let arrayBuffer = res.data;
  if (arrayBuffer) {
    let byteArray = new Uint8Array(arrayBuffer);
    let sections = Multipart.parse(byteArray, boundary);
    return sections;
  }
}

const API_URL = `http://3.134.98.180:8100/api/detect`; // can be stored in ENV

function App() {
  const [image, setImage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [coordinates, setCoordinates] = useState({});
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const formSubmitHandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("test_image", image);
    const processedResponse = await axios.post(API_URL, formData, {
      responseType: "arraybuffer",
    });
    const sections = processData(processedResponse);
    const labelData = JSON.parse(await sections[1].file.text());
    setCoordinates(...labelData);
    setImageUrl(URL.createObjectURL(sections[sections.length - 1].file));
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    imageRef.current.onload = () => {
      ctx.drawImage(imageRef.current, 0, 0);
      ctx.beginPath();
      const { left, top, right, bottom, label_type_name } = coordinates;
      console.log(coordinates);
      ctx.rect(left, top, right - left, bottom - top);
      ctx.fillText(label_type_name, left, bottom + 10);
      ctx.stroke();
    };
  }, [coordinates]);

  useEffect(() => {
    if (imageUrl.length > 0 && imageRef) {
      draw();
    }
  }, [draw, imageUrl]);

  return (
    <div className="App">
      <form encType="multipart/form-data" onSubmit={formSubmitHandler}>
        <input
          onChange={(event) =>
            setImage(URL.createObjectURL(event.target.files[0]))
          }
          type="file"
        ></input>
        <button type="submit">Upload Image</button>
      </form>
      <div>
        {imageUrl.length > 0 && <img alt="new" src={image} id="original"></img>}
      </div>
      <div>
        <img
          ref={imageRef}
          style={{ display: "none" }}
          alt="new"
          src={imageUrl}
          id="processed"
        ></img>
      </div>
      <div>
        <canvas ref={canvasRef} id="myCanvas" width="500" height="500"></canvas>
      </div>
    </div>
  );
}

export default App;
