'use client'

import { Group, Circle, Text } from 'react-konva'

interface ThoughtBubbleProps {
  id: string
  x: number
  y: number
  content: string
  authorNickname: string
  commentCount: number
  onClick: () => void
}

export function ThoughtBubble({
  x,
  y,
  content,
  authorNickname,
  commentCount,
  onClick,
}: ThoughtBubbleProps) {
  const radius = 40
  const previewText = content.length > 20 ? content.substring(0, 20) + '...' : content

  return (
    <Group x={x} y={y} onClick={onClick}>
      {/* Main bubble */}
      <Circle
        radius={radius}
        fill="#fff"
        stroke="#3b82f6"
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.2}
        shadowOffsetX={2}
        shadowOffsetY={2}
      />

      {/* Comment count badge */}
      {commentCount > 0 && (
        <>
          <Circle
            x={radius - 10}
            y={-radius + 10}
            radius={12}
            fill="#ef4444"
          />
          <Text
            x={radius - 10}
            y={-radius + 10}
            text={commentCount > 99 ? '99+' : commentCount.toString()}
            fontSize={10}
            fill="#fff"
            align="center"
            verticalAlign="middle"
            offsetX={commentCount > 9 ? 7 : 4}
            offsetY={5}
          />
        </>
      )}

      {/* Preview text */}
      <Text
        x={-radius + 5}
        y={-10}
        text={previewText}
        fontSize={10}
        fill="#333"
        width={radius * 2 - 10}
        align="center"
      />

      {/* Author */}
      <Text
        x={-radius}
        y={radius + 5}
        text={authorNickname}
        fontSize={8}
        fill="#666"
        width={radius * 2}
        align="center"
      />
    </Group>
  )
}
