// Attachments composable with VueQuery
import { computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/plugins/supabase'
import type { Attachment, AttachmentFormData } from '@/types/database'

export function useAttachments() {
  const queryClient = useQueryClient()

  // Add attachment record to database
  const addAttachmentMutation = useMutation({
    mutationFn: async (formData: AttachmentFormData & { goal_id: string }) => {
      const { data, error } = await supabase
        .from('attachments')
        .insert(formData as any) // Use any to bypass strict Postgrest types for now
        .select()
        .single()

      if (error) throw error
      return data as Attachment
    },
    onSuccess: (data: Attachment) => {
      queryClient.invalidateQueries({ queryKey: ['goal', data.goal_id] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })

  // Upload file to Supabase Storage and then add attachment record
  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, goal_id, title }: { file: File; goal_id: string; title: string }) => {
      // 1. Upload to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${goal_id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

      // 3. Add record to database
      return addAttachmentMutation.mutateAsync({
        goal_id,
        title,
        type: 'image',
        url: publicUrl
      })
    }
  })

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      // Get the attachment first
      const { data: attachment } = await supabase
        .from('attachments')
        .select('*')
        .eq('id', attachmentId)
        .single()

      if (!attachment) return null

      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId)

      if (error) throw error
      return (attachment as Attachment).goal_id
    },
    onSuccess: (goalId: string | null) => {
      if (goalId) {
        queryClient.invalidateQueries({ queryKey: ['goal', goalId] })
      }
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })

  return {
    addAttachment: addAttachmentMutation.mutateAsync,
    uploadFile: uploadFileMutation.mutateAsync,
    deleteAttachment: deleteAttachmentMutation.mutateAsync,
    isAdding: computed(() => addAttachmentMutation.isPending.value || uploadFileMutation.isPending.value),
    isDeleting: deleteAttachmentMutation.isPending
  }
}
