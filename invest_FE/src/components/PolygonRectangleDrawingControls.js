import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import './PolygonRectangleDrawingControls.css';

const PolygonRectangleDrawingControls = ({ onShapeDrawn }) => {
  const map = useMap();
  const [drawingMode, setDrawingMode] = useState(null); // 'polygon', 'rectangle', או null
  const [points, setPoints] = useState([]);
  const [tempShape, setTempShape] = useState(null);
  const [drawnShape, setDrawnShape] = useState(null);

  useEffect(() => {
    if (!map) return;

    // יצירת שכבה לציור זמני
    const drawingLayer = new L.FeatureGroup();
    map.addLayer(drawingLayer);

    // מאזין לקליקים על המפה
    const handleMapClick = (e) => {
      if (!drawingMode) return;

      const newPoint = [e.latlng.lat, e.latlng.lng];

      if (drawingMode === 'polygon') {
        handlePolygonClick(newPoint, drawingLayer);
      } else if (drawingMode === 'rectangle' && points.length === 0) {
        handleFirstRectangleClick(newPoint);
      }
    };

    // מאזין לתזוזת העכבר
    const handleMouseMove = (e) => {
      if (!drawingMode || !points.length) return;

      const currentPoint = [e.latlng.lat, e.latlng.lng];

      if (drawingMode === 'polygon') {
        updateTempPolygon(currentPoint, drawingLayer);
      } else if (drawingMode === 'rectangle') {
        updateTempRectangle(currentPoint, drawingLayer);
      }
    };

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      map.removeLayer(drawingLayer);
    };
  }, [map, drawingMode, points]);

  const handlePolygonClick = (newPoint, layer) => {
    // אם זו הנקודה הראשונה או המרחק מהנקודה הראשונה קטן - סגור את הפוליגון
    if (points.length > 2 && 
        getDistance(newPoint, points[0]) < 0.0001) {
      finishPolygon(layer);
    } else {
      setPoints([...points, newPoint]);
    }
  };

  const handleFirstRectangleClick = (point) => {
    setPoints([point]);
  };

  const updateTempPolygon = (currentPoint, layer) => {
    layer.clearLayers();
    if (points.length > 0) {
      const tempPoints = [...points, currentPoint];
      const polygon = L.polygon(tempPoints, {
        color: '#3388ff',
        weight: 2,
        fillOpacity: 0.2
      });
      layer.addLayer(polygon);
      setTempShape(polygon);
    }
  };

  const updateTempRectangle = (currentPoint, layer) => {
    if (points.length === 1) {
      layer.clearLayers();
      const bounds = [points[0], currentPoint];
      const rectangle = L.rectangle(bounds, {
        color: '#3388ff',
        weight: 2,
        fillOpacity: 0.2
      });
      layer.addLayer(rectangle);
      setTempShape(rectangle);

      // סיום ציור המלבן בקליק השני
      const handleSecondClick = (e) => {
        const secondPoint = [e.latlng.lat, e.latlng.lng];
        finishRectangle([points[0], secondPoint]);
        map.off('click', handleSecondClick);
      };
      map.once('click', handleSecondClick);
    }
  };

  const finishPolygon = (layer) => {
    layer.clearLayers();
    const finalShape = {
      type: 'polygon',
      coordinates: points,
      bounds: L.latLngBounds(points)
    };
    setDrawnShape(finalShape);
    onShapeDrawn(finalShape);
    setPoints([]);
    setDrawingMode(null);
  };

  const finishRectangle = (corners) => {
    const bounds = L.latLngBounds(corners);
    const finalShape = {
      type: 'rectangle',
      coordinates: [
        [bounds.getNorth(), bounds.getWest()],
        [bounds.getNorth(), bounds.getEast()],
        [bounds.getSouth(), bounds.getEast()],
        [bounds.getSouth(), bounds.getWest()]
      ],
      bounds: bounds
    };
    setDrawnShape(finalShape);
    onShapeDrawn(finalShape);
    setPoints([]);
    setDrawingMode(null);
  };

  const getDistance = (point1, point2) => {
    return Math.sqrt(
      Math.pow(point1[0] - point2[0], 2) + 
      Math.pow(point1[1] - point2[1], 2)
    );
  };

  const startDrawing = (mode) => {
    setDrawingMode(mode);
    setPoints([]);
    setTempShape(null);
  };

  return (
    <div className="drawing-controls">
      <button
        className={`drawing-button ${drawingMode === 'polygon' ? 'active' : ''}`}
        onClick={() => startDrawing('polygon')}
        disabled={drawingMode === 'rectangle'}
      >
        Draw Polygon
      </button>
      <button
        className={`drawing-button ${drawingMode === 'rectangle' ? 'active' : ''}`}
        onClick={() => startDrawing('rectangle')}
        disabled={drawingMode === 'polygon'}
      >
        Draw Rectangle
      </button>
      {drawingMode && (
        <button
          className="drawing-button cancel"
          onClick={() => {
            setDrawingMode(null);
            setPoints([]);
            setTempShape(null);
          }}
        >
          Cancel Drawing
        </button>
      )}
      {points.length > 0 && drawingMode === 'polygon' && (
        <button
          className="drawing-button finish"
          onClick={() => finishPolygon(map)}
        >
          Finish Drawing
        </button>
      )}
    </div>
  );
};

export default PolygonRectangleDrawingControls; 