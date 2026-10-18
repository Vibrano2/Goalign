import React, { useEffect, useRef } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';

// --- Pixel-Perfect Rendering Helpers ---
function centreOffset(lineBitmapWidth) {
    return Math.floor(lineBitmapWidth * 0.5);
}

export function positionsLine(
    positionMedia,
    pixelRatio,
    desiredWidthMedia = 1,
    widthIsBitmap = false
) {
    const scaledPosition = Math.round(pixelRatio * positionMedia);
    const lineBitmapWidth = widthIsBitmap
        ? desiredWidthMedia
        : Math.round(desiredWidthMedia * pixelRatio);
    const offset = centreOffset(lineBitmapWidth);
    const position = scaledPosition - offset;
    return { position, length: lineBitmapWidth };
}

export function positionsBox(
    position1Media,
    position2Media,
    pixelRatio
) {
    const scaledPosition1 = Math.round(pixelRatio * position1Media);
    const scaledPosition2 = Math.round(pixelRatio * position2Media);
    return {
        position: Math.min(scaledPosition1, scaledPosition2),
        length: Math.abs(scaledPosition2 - scaledPosition1) + 1,
    };
}

export function gridAndCrosshairBitmapWidth(horizontalPixelRatio) {
    return Math.max(1, Math.floor(horizontalPixelRatio));
}

export function gridAndCrosshairMediaWidth(horizontalPixelRatio) {
    return (
        gridAndCrosshairBitmapWidth(horizontalPixelRatio) / horizontalPixelRatio
    );
}

const alignToMinimalWidthLimit = 4;
const showSpacingMinimalBarWidth = 1;

function columnSpacing(barSpacingMedia, horizontalPixelRatio) {
    return Math.ceil(barSpacingMedia * horizontalPixelRatio) <=
        showSpacingMinimalBarWidth
        ? 0
        : Math.max(1, Math.floor(horizontalPixelRatio));
}

function desiredColumnWidth(
    barSpacingMedia,
    horizontalPixelRatio,
    spacing
) {
    return (
        Math.round(barSpacingMedia * horizontalPixelRatio) -
        (spacing ?? columnSpacing(barSpacingMedia, horizontalPixelRatio))
    );
}

function columnCommon(
    barSpacingMedia,
    horizontalPixelRatio
) {
    const spacing = columnSpacing(barSpacingMedia, horizontalPixelRatio);
    const columnWidthBitmap = desiredColumnWidth(
        barSpacingMedia,
        horizontalPixelRatio,
        spacing
    );
    const shiftLeft = columnWidthBitmap % 2 === 0;
    const columnHalfWidthBitmap = (columnWidthBitmap - (shiftLeft ? 0 : 1)) / 2;
    return {
        spacing,
        shiftLeft,
        columnHalfWidthBitmap,
        horizontalPixelRatio,
    };
}

function calculateColumnPosition(
    xMedia,
    columnData,
    previousPosition
) {
    const xBitmapUnRounded = xMedia * columnData.horizontalPixelRatio;
    const xBitmap = Math.round(xBitmapUnRounded);
    const xPositions = {
        left: xBitmap - columnData.columnHalfWidthBitmap,
        right:
            xBitmap +
            columnData.columnHalfWidthBitmap -
            (columnData.shiftLeft ? 1 : 0),
        shiftLeft: xBitmap > xBitmapUnRounded,
    };
    const expectedAlignmentShift = columnData.spacing + 1;
    if (previousPosition) {
        if (xPositions.left - previousPosition.right !== expectedAlignmentShift) {
            if (previousPosition.shiftLeft) {
                previousPosition.right = xPositions.left - expectedAlignmentShift;
            } else {
                xPositions.left = previousPosition.right + expectedAlignmentShift;
            }
        }
    }
    return xPositions;
}

function fixPositionsAndReturnSmallestWidth(
    positions,
    initialMinWidth
) {
    return positions.reduce((smallest, position) => {
        if (position.right < position.left) {
            position.right = position.left;
        }
        const width = position.right - position.left + 1;
        return Math.min(smallest, width);
    }, initialMinWidth);
}

function fixAlignmentForNarrowColumns(
    positions,
    minColumnWidth
) {
    return positions.map((position) => {
        const width = position.right - position.left + 1;
        if (width <= minColumnWidth) return position;
        if (position.shiftLeft) {
            position.right -= 1;
        } else {
            position.left += 1;
        }
        return position;
    });
}

export function calculateColumnPositions(
    xMediaPositions,
    barSpacingMedia,
    horizontalPixelRatio
) {
    const common = columnCommon(barSpacingMedia, horizontalPixelRatio);
    const positions = new Array(xMediaPositions.length);
    let previous = undefined;
    for (let i = 0; i < xMediaPositions.length; i++) {
        positions[i] = calculateColumnPosition(
            xMediaPositions[i],
            common,
            previous
        );
        previous = positions[i];
    }
    const initialMinWidth = Math.ceil(barSpacingMedia * horizontalPixelRatio);
    const minColumnWidth = fixPositionsAndReturnSmallestWidth(
        positions,
        initialMinWidth
    );
    if (common.spacing > 0 && minColumnWidth < alignToMinimalWidthLimit) {
        return fixAlignmentForNarrowColumns(positions, minColumnWidth);
    }
    return positions;
}

export function calculateColumnPositionsInPlace(
    items,
    barSpacingMedia,
    horizontalPixelRatio,
    startIndex,
    endIndex
) {
    const common = columnCommon(barSpacingMedia, horizontalPixelRatio);
    let previous = undefined;
    for (let i = startIndex; i < Math.min(endIndex, items.length); i++) {
        items[i].column = calculateColumnPosition(items[i].x, common, previous);
        previous = items[i].column;
    }
    const minColumnWidth = items.reduce(
        (smallest, item, index) => {
            if (!item.column || index < startIndex || index > endIndex)
                return smallest;
            if (item.column.right < item.column.left) {
                item.column.right = item.column.left;
            }
            const width = item.column.right - item.column.left + 1;
            return Math.min(smallest, width);
        },
        Math.ceil(barSpacingMedia * horizontalPixelRatio)
    );
    if (common.spacing > 0 && minColumnWidth < alignToMinimalWidthLimit) {
        items.forEach(
            (item, index) => {
                if (!item.column || index < startIndex || index > endIndex) return;
                const width = item.column.right - item.column.left + 1;
                if (width <= minColumnWidth) return item;
                if (item.column.shiftLeft) {
                    item.column.right -= 1;
                } else {
                    item.column.left += 1;
                }
                return item.column;
            }
        );
    }
}

function optimalCandlestickWidth(
    barSpacing,
    pixelRatio
) {
    const barSpacingSpecialCaseFrom = 2.5;
    const barSpacingSpecialCaseTo = 4;
    const barSpacingSpecialCaseCoeff = 3;
    if (barSpacing >= barSpacingSpecialCaseFrom && barSpacing <= barSpacingSpecialCaseTo) {
        return Math.floor(barSpacingSpecialCaseCoeff * pixelRatio);
    }
    // coeff should be 1 on small barspacing and go to 0.8 while bar spacing grows
    const barSpacingReducingCoeff = 0.2;
    const coeff =
        1 -
        (barSpacingReducingCoeff *
            Math.atan(
                Math.max(barSpacingSpecialCaseTo, barSpacing) - barSpacingSpecialCaseTo
            )) /
            (Math.PI * 0.5);
    const res = Math.floor(barSpacing * coeff * pixelRatio);
    const scaledBarSpacing = Math.floor(barSpacing * pixelRatio);
    const optimal = Math.min(res, scaledBarSpacing);
    return Math.max(Math.floor(pixelRatio), optimal);
}

export function candlestickWidth(
    barSpacing,
    horizontalPixelRatio
) {
    let width = optimalCandlestickWidth(barSpacing, horizontalPixelRatio);
    if (width >= 2) {
        const wickWidth = Math.floor(horizontalPixelRatio);
        if (wickWidth % 2 !== width % 2) {
            width--;
        }
    }
    return width;
}

// The user's requested custom series class stub
class MyCustomSeries {
    constructor() {
        this._data = [];
        this._paneView = {
            renderer: () => {
                return {
                    draw: (target, priceScale, timeScale) => {
                        // No-op for the stub custom series
                    }
                };
            }
        };
    }
    
    update(data) {
        this._data = data;
    }
    
    priceValueBuilder(plotRow) {
        // [low, high, close]
        return [plotRow.value, plotRow.value, plotRow.value];
    }
    
    isWhitespace(data) {
        return false;
    }
    
    paneViews() {
        return [];
    }

    defaultOptions() {
        return {
            customOption: 0,
        };
    }
}

// The user's requested custom primitive class stub
class MyCustomPrimitive {
    attached({ chart, series, requestUpdate }) {
        this._chart = chart;
        this._series = series;
        this._requestUpdate = requestUpdate;
    }

    detached() {
        this._chart = undefined;
        this._series = undefined;
        this._requestUpdate = undefined;
    }

    updateAllViews() {
        // Called when the chart is updated
    }

    paneViews() {
        return []; // Return empty array of pane views to prevent crashes
    }

    timeAxisViews() {
        return []; // Return empty array of time axis views
    }

    priceAxisViews() {
        return []; // Return empty array of price axis views
    }
}

function myRenderingFunction(scope) {
    const ctx = scope.context;

    // save the current state of the context to the stack
    ctx.save();

    try {
        // example code
        scope.context.beginPath();
        scope.context.rect(0, 0, scope.mediaSize.width, scope.mediaSize.height);
        scope.context.fillStyle = 'rgba(100, 200, 50, 0.5)';
        scope.context.fill();
    } finally {
        // restore the saved context from the stack
        ctx.restore();
    }
}

// The user's requested custom pane primitive class stub
class MyCustomPanePrimitive {
    attached({ chart, requestUpdate }) {
        this._chart = chart;
        this._requestUpdate = requestUpdate;
    }

    detached() {
        this._chart = undefined;
        this._requestUpdate = undefined;
    }

    updateAllViews() {}

    paneViews() {
        return [
            {
                renderer: {
                    draw: target => {
                        // target is an instance of CanvasRenderingTarget2D
                        target.useMediaCoordinateSpace(scope => {
                            myRenderingFunction(scope);
                        });
                    },
                },
            },
        ];
    }

    timeAxisViews() { return []; }
    priceAxisViews() { return []; }
}

export default function CustomPlugin() {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: 'white' },
          textColor: 'black',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
      });

      // Removed addCustomSeries stub to prevent internal renderer crash

      const data = [
          { time: 1642425322, value: 123, customValue: 456 },
          { time: 1642511722, value: 125, customValue: 457 },
          { time: 1642598122, value: 122, customValue: 458 },
          { time: 1642684522, value: 130, customValue: 459 },
          { time: 1642770922, value: 128, customValue: 460 },
          { time: 1642857322, value: 135, customValue: 461 },
      ];

      // myCustomSeries.setData(data);

      // --- Custom Primitive Implementation ---
      const myCustomPrimitive = new MyCustomPrimitive();
      
      // We need a standard series to attach the primitive to
      const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF' });
      const lineData = [
          { time: 1642425322, value: 120 },
          { time: 1642511722, value: 122 },
          { time: 1642598122, value: 121 },
          { time: 1642684522, value: 128 },
          { time: 1642770922, value: 125 },
          { time: 1642857322, value: 132 },
      ];
      lineSeries.setData(lineData);

      // Attach the primitive to the series
      lineSeries.attachPrimitive(myCustomPrimitive);

      // --- Custom Pane Primitive Implementation ---
      const myCustomPanePrimitive = new MyCustomPanePrimitive();
      const mainPane = chart.panes()[0];
      mainPane.attachPrimitive(myCustomPanePrimitive);

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background text-primary font-sans p-4">
      <div className="container mx-auto max-w-7xl bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden flex flex-col p-6">
        <h1 className="text-2xl font-bold text-primary mb-2">Custom Series Plugin & Primitives</h1>
        <p className="text-secondary mb-6">Instantiating a custom series and a custom primitive interface exactly as documented.</p>
        <div ref={chartContainerRef} className="w-full h-[500px]" />
      </div>
    </div>
  );
}
