import { ref } from 'vue'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  rotation: number
  size: number
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3'
]

export function useConfetti() {
  const pieces = ref<ConfettiPiece[]>([])
  let idCounter = 0

  function trigger(count = 50) {
    const newPieces: ConfettiPiece[] = []

    for (let i = 0; i < count; i++) {
      newPieces.push({
        id: idCounter++,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)] as string,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8
      })
    }

    pieces.value = newPieces

    // Clear after animation completes
    setTimeout(() => {
      pieces.value = []
    }, 4500)
  }

  function clear() {
    pieces.value = []
  }

  return {
    pieces,
    trigger,
    clear
  }
}
