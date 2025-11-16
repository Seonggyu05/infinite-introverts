'use client'

import { Circle, Line, Group, Text } from 'react-konva'
import { UI } from '@/lib/constants/canvas'

interface StickFigureProps {
  x: number
  y: number
  nickname: string
  isCurrentUser?: boolean
  onDragEnd?: (x: number, y: number) => void
}

export function StickFigure({
  x,
  y,
  nickname,
  isCurrentUser = false,
  onDragEnd,
}: StickFigureProps) {
  const color = isCurrentUser ? '#3b82f6' : '#6b7280' // Blue for current user, gray for others
  const radius = UI.AVATAR_RADIUS

  const handleDragEnd = (e: any) => {
    if (onDragEnd) {
      onDragEnd(e.target.x(), e.target.y())
    }
  }

  return (
    <Group
      x={x}
      y={y}
      draggable={isCurrentUser}
      onDragEnd={handleDragEnd}
    >
      {/* Head */}
      <Circle
        x={0}
        y={-radius * 1.5}
        radius={radius * 0.5}
        stroke={color}
        strokeWidth={3}
        fill="white"
      />

      {/* Body */}
      <Line
        points={[0, -radius, 0, radius * 0.5]}
        stroke={color}
        strokeWidth={3}
        lineCap="round"
      />

      {/* Left arm */}
      <Line
        points={[0, -radius * 0.5, -radius * 0.7, 0]}
        stroke={color}
        strokeWidth={3}
        lineCap="round"
      />

      {/* Right arm */}
      <Line
        points={[0, -radius * 0.5, radius * 0.7, 0]}
        stroke={color}
        strokeWidth={3}
        lineCap="round"
      />

      {/* Left leg */}
      <Line
        points={[0, radius * 0.5, -radius * 0.5, radius * 1.5]}
        stroke={color}
        strokeWidth={3}
        lineCap="round"
      />

      {/* Right leg */}
      <Line
        points={[0, radius * 0.5, radius * 0.5, radius * 1.5]}
        stroke={color}
        strokeWidth={3}
        lineCap="round"
      />

      {/* Nickname label */}
      <Text
        x={-50}
        y={radius * 2}
        width={100}
        text={nickname}
        fontSize={14}
        fontFamily="Arial"
        fill={isCurrentUser ? '#3b82f6' : '#374151'}
        fontStyle={isCurrentUser ? 'bold' : 'normal'}
        align="center"
      />

      {/* Selection indicator for current user */}
      {isCurrentUser && (
        <Circle
          x={0}
          y={0}
          radius={radius * 2}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[5, 5]}
          opacity={0.5}
        />
      )}
    </Group>
  )
}
