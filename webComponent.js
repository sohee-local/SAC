define(["https://cdn.plot.ly/plotly-2.30.0.min.js"], function (Plotly) {
  return {
    render: async function (widget) {
      // ✅ 기존 컨테이너 정리 및 Shadow DOM 설정
      widget.container.innerHTML = "";
      const shadowRoot = widget.shadowRoot;
      const chartDiv = document.createElement("div");
      const chartId = "plotly-chart-" + widget.id; // unique ID
      chartDiv.id = chartId;
      chartDiv.style.width = "100%";
      chartDiv.style.height = "100%";
      shadowRoot.appendChild(chartDiv);

      // SAC 데이터 바인딩에서 데이터 가져오기
      const dataBinding = widget.dataBindings.dataBinding;

      // 데이터 피드 유효성 검사 (manifest.json에 정의된 ID 기준)
      if (!dataBinding || !dataBinding.dimensions || !dataBinding.mainStructureMembers) {
        console.warn("차트 데이터 피드가 올바르게 바인딩되지 않았습니다.");
        chartDiv.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">데이터 피드 오류: Dimensions 또는 Measures가 바인딩되지 않았습니다.</div>';
        return;
      }

      // manifest.json의 'id' (예: "dimensions")를 사용하여 피드 객체를 가져옴
      const dimensionsFeed = dataBinding.dimensions.find(feed => feed.id === "dimensions");
      const measuresFeed = dataBinding.mainStructureMembers.find(feed => feed.id === "measures");

      // 실제 차트에서 사용할 차원 및 측정값의 ID(열 이름)를 추출합니다.
      // dimensionsFeed.members는 SAC 빌더에서 사용자가 Dimensions 피드에 드롭한 차원의 목록을 담고 있습니다.
      // 우리의 CSV 파일에서는 'DATE' 열이 dimensions에 해당하므로, 첫 번째 멤버를 X축으로 가정합니다.
      const xAxisId = dimensionsFeed && dimensionsFeed.members && dimensionsFeed.members.length > 0 
                      ? dimensionsFeed.members[0].id // 예: "DATE"
                      : null;

      // measuresFeed.members는 SAC 빌더에서 사용자가 Measures 피드에 드롭한 측정값들의 목록을 담고 있습니다.
      const measureIdsToStack = measuresFeed && measuresFeed.members 
                                ? measuresFeed.members.map(m => m.id) // 예: ["SDD Qty", "ITG Qty"]
                                : [];

      if (!xAxisId || measureIdsToStack.length === 0) {
        console.error("SAC 빌더에서 차원(Dimensions) 또는 측정값(Measures)이 올바르게 바인딩되지 않았습니다.");
        chartDiv.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">데이터 바인딩 오류: 필드를 확인하세요.</div>';
        return;
      }

      let resultSet;
      try {
        resultSet = await dataBinding.getResultSet(); // SAC로부터 모든 바인딩된 데이터를 포함하는 결과셋 가져오기
      } catch (e) {
        console.error("SAC에서 데이터 가져오기 중 오류 발생:", e);
        chartDiv.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">데이터 가져오기 오류 발생.</div>';
        return;
      }

      if (!resultSet || resultSet.length === 0) {
        console.warn("결과셋이 비어 있습니다. 표시할 데이터가 없습니다.");
        chartDiv.innerHTML = '<div style="color: orange; text-align: center; padding: 20px;">표시할 데이터가 없습니다.</div>';
        return;
      }

      // --- 디버깅을 위한 콘솔 로그 (배포 전 제거 권장) ---
      console.log("SAC로부터 받은 resultSet:", resultSet);
      console.log("X축 실제 ID (CSV 열 이름):", xAxisId);
      console.log("측정값 실제 ID들 (CSV 열 이름):", measureIdsToStack);
      // ----------------------------------------------------

      // Plotly 차트 데이터 준비 (동적 생성)
      const xValues = resultSet.map(row => row[xAxisId]); // resultSet의 row에서 실제 X축 열 이름 사용
      const traceData = [];
      const colors = widget.properties.colorPalette ? 
                     widget.properties.colorPalette.split(',').map(c => c.trim()) : 
                     ['#a84300', '#f5c6a5', '#007bff', '#28a745', '#dc3545', '#ffc107', '#6c757d', '#17a2b8', '#fd7e14', '#e83e8c'];

      // 각 측정값에 대해 Plotly trace 생성 (스택형 차트용)
      measureIdsToStack.forEach((measureActualId, index) => {
        const yValues = resultSet.map(row => parseFloat(row[measureActualId]) || 0); // 실제 측정값 열 이름 사용
        traceData.push({
          x: xValues,
          y: yValues,
          name: measuresFeed.members.find(m => m.id === measureActualId)?.description || measureActualId, // 측정값의 설명 또는 ID를 시리즈 이름으로 사용
          type: 'bar', // 2D 바 차트
          marker: { color: colors[index % colors.length] }
        });
      });

      const layout = {
        title: widget.properties.title || 'GLOBAL BUFFER', // 위젯 속성의 제목 사용
        barmode: 'stack', // 스택형 바 차트
        showlegend: true,
        margin: { t: 50, l: 40, r: 40, b: 80 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        xaxis: {
          tickangle: -45, // X축 레이블 각도
          type: 'category', // X축 타입을 category로 명시 (문자열 날짜 형식 처리)
          title: '날짜' // X축 제목 명시
        },
        yaxis: {
          title: '수량', // Y축 제목 명시
          rangemode: 'tozero' // Y축 0부터 시작
        }
      };

      // Plotly 차트 생성
      Plotly.newPlot(chartId, traceData, layout);

      // SAC 이벤트 디스패치 (클릭 이벤트 예시)
      Plotly.newPlot(chartId, traceData, layout).then(function(gd) {
        gd.on('plotly_click', function(data) {
          if (data.points.length > 0) {
            const point = data.points[0];
            const selectedCategory = point.x;
            const selectedSeries = point.data.name; // 클릭된 바의 시리즈 이름 (측정값 이름)
            const selectedValue = point.y;

            widget.dispatchEvent(new CustomEvent('onBarClick', { // manifest.json의 'onBarClick' 이벤트 사용
              detail: {
                category: selectedCategory,
                value: selectedValue,
                series: selectedSeries
              }
            }));
          }
        });
      });
      widget.dispatchEvent(new CustomEvent('onLoadComplete', { detail: {} })); // (manifest.json에 onLoadComplete가 없음)
    }
  };
});