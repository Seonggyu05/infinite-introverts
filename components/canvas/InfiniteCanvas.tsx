'use client'

import { Stage, Layer, Line } from 'react-konva'
import { useEffect, useRef, useState } from 'react'
import { CANVAS } from '@/lib/constants/canvas'
import { AvatarLayer } from './AvatarLayer'
import { ThoughtLayer } from '../thoughts/ThoughtLayer'
import { ChatConnectors } from '../chat/ChatConnectors'

interface Profile {
  id: string
  position_x: number
  position_y: number
}

interface InfiniteCanvasProps {
  currentUserId: string
  currentUserNickname: string
  onCurrentPositionChange: (position: { x: number; y: number }) => void
  profiles: Profile[]
}

export function InfiniteCanvas({
  currentUserId,
  currentUserNickname,
  onCurrentPositionChange,
  profiles
}: InfiniteCanvasProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    scale: 1,
  })
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update current position for parent component
  useEffect(() => {
    const centerX = -viewport.x / viewport.scale
    const centerY = -viewport.y / viewport.scale
    onCurrentPositionChange({ x: centerX, y: centerY })
  }, [viewport.x, viewport.y, viewport.scale, onCurrentPositionChange])

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Handle zoom with mouse wheel
  const handleWheel = (e: any) => {
    e.evt.preventDefault()

    const stage = stageRef.current
    if (!stage) return

    const oldScale = viewport.scale
    const pointer = stage.getPointerPosition()

    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    }

    // Zoom sensitivity
    const scaleBy = 1.05
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = Math.max(
      CANVAS.MIN_ZOOM,
      Math.min(CANVAS.MAX_ZOOM, oldScale * (direction > 0 ? scaleBy : 1 / scaleBy))
    )

    setViewport({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }

  // Handle pan (drag background)
  const handleDragEnd = (e: any) => {
    setViewport({
      ...viewport,
      x: e.target.x(),
      y: e.target.y(),
    })
  }

  // Return to origin (0, 0)
  const handleGoHome = () => {
    setViewport({
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      scale: 1,
    })
  }

  // Draw grid for visual reference
  const renderGrid = () => {
    const gridLines: JSX.Element[] = []
    const gridSize = CANVAS.GRID_SIZE
    const stage = stageRef.current

    if (!stage) return null

    const startX = Math.floor((-viewport.x / viewport.scale) / gridSize) * gridSize
    const endX = Math.ceil((dimensions.width - viewport.x) / viewport.scale / gridSize) * gridSize
    const startY = Math.floor((-viewport.y / viewport.scale) / gridSize) * gridSize
    const endY = Math.ceil((dimensions.height - viewport.y) / viewport.scale / gridSize) * gridSize

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      gridLines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke="#e5e7eb"
          strokeWidth={1 / viewport.scale}
          listening={false}
        />
      )
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      gridLines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke="#e5e7eb"
          strokeWidth={1 / viewport.scale}
          listening={false}
        />
      )
    }

    // Origin axes (thicker lines)
    gridLines.push(
      <Line
        key="origin-x"
        points={[startX, 0, endX, 0]}
        stroke="#9ca3af"
        strokeWidth={2 / viewport.scale}
        listening={false}
      />,
      <Line
        key="origin-y"
        points={[0, startY, 0, endY]}
        stroke="#9ca3af"
        strokeWidth={2 / viewport.scale}
        listening={false}
      />
    )

    return gridLines
  }

  if (dimensions.width === 0) return null

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        draggable
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        onDragEnd={handleDragEnd}
      >
        <Layer>
          {/* Grid background */}
          {renderGrid()}
        </Layer>

        {/* Content layer */}
        <Layer>
          {/* Chat connector lines */}
          <ChatConnectors currentUserId={currentUserId} profiles={profiles} />

          {/* Thought bubbles */}
          <ThoughtLayer currentUserId={currentUserId} />

          {/* Avatars */}
          <AvatarLayer
            currentUserId={currentUserId}
            currentUserNickname={currentUserNickname}
          />
        </Layer>
      </Stage>

      {/* UI Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Home button */}
        <button
          onClick={handleGoHome}
          className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-50 transition-colors font-medium"
          title="Return to origin (0, 0)"
        >
          🏠 Home
        </button>

        {/* Zoom controls */}
        <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1">
          <button
            onClick={() => setViewport(v => ({ ...v, scale: Math.min(CANVAS.MAX_ZOOM, v.scale * 1.2) }))}
            className="px-3 py-1 hover:bg-gray-100 rounded transition-colors text-lg font-bold"
            title="Zoom in"
          >
            +
          </button>
          <div className="text-center text-xs text-gray-600 px-2">
            {Math.round(viewport.scale * 100)}%
          </div>
          <button
            onClick={() => setViewport(v => ({ ...v, scale: Math.max(CANVAS.MIN_ZOOM, v.scale / 1.2) }))}
            className="px-3 py-1 hover:bg-gray-100 rounded transition-colors text-lg font-bold"
            title="Zoom out"
          >
            −
          </button>
        </div>
      </div>

      {/* Position indicator */}
      <div className="absolute bottom-4 left-4 bg-black/75 text-white px-3 py-2 rounded-lg text-sm font-mono">
        x: {Math.round(-viewport.x / viewport.scale)},
        y: {Math.round(-viewport.y / viewport.scale)}
      </div>
    </div>
  )
}
