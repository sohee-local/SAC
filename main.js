define(["https://cdn.plot.ly/plotly-2.30.0.min.js"], function () {
  return {
    render: function (widget) {
      // ✅ 기존 컨테이너 정리
      widget.container.innerHTML = "";

      // ✅ WebComponent 내부 Shadow DOM 사용
      const shadowRoot = widget.shadowRoot;
      const chartDiv = document.createElement("div");
      const chartId = "plotly-3d-bar-" + widget.id; // unique ID
      chartDiv.id = chartId;
      chartDiv.style.width = "100%";
      chartDiv.style.height = "100%";
      shadowRoot.appendChild(chartDiv);

      const chartData = {
        x: ["202401","202402","202403","202404","202405","202406","202407","202408","202409","202410","202411","202412","202501","202502","202503","202504"],
        sdd: [8159,5646,4903,5048,7085,7549,6732,5340,5354,4261,2914,1083,1956,1031,1207,774],
        itg: [3275,3312,2550,2586,1895,1897,1679,1172,1292,1279,1204,1075,783,1204,1112,491]
      };

      const trace1 = {
        x: chartData.x,
        y: chartData.sdd,
        name: 'SDD Qty',
        type: 'bar',
        marker: { color: '#a84300' }
      };

      const trace2 = {
        x: chartData.x,
        y: chartData.itg,
        name: 'ITG Qty',
        type: 'bar',
        marker: { color: '#f5c6a5' }
      };

      const layout = {
        title: 'GLOBAL BUFFER',
        barmode: 'stack',
        showlegend: true,
        margin: { t: 50, l: 40, r: 40, b: 80 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        xaxis: {
          tickangle: -45
        }
      };

      Plotly.newPlot(chartId, [trace1, trace2], layout);
    }
  };
});
