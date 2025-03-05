import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useVoroforce } from '../../../lib/voroforce'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { Switch } from '../../ui/switch'

const formSchema = z.object({
  name: z.string(),
  baseUrl: z.string(),
  property: z.enum(['title', 'imdbId', 'tmdbId']),
  slug: z.boolean(),
})

export function AddCustomLinkDialog() {
  const userConfig = useVoroforce((state) => state.userConfig)
  const setUserConfig = useVoroforce((state) => state.setUserConfig)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property: 'title',
      slug: false,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    userConfig.customLinks = [...(userConfig.customLinks ?? [])]
    const sameNameIndex = userConfig.customLinks.findIndex(
      ({ name }) => name === values.name,
    )
    if (sameNameIndex !== -1) {
      userConfig.customLinks[sameNameIndex] = values
    } else {
      userConfig.customLinks.push(values)
    }
    setUserConfig(userConfig)
    form.reset()
    setOpen(false)
  }

  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size='icon'
          className='hidden md:inline-flex'
          title='Add new link'
        >
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] md:sm:max-w-[625px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <DialogHeader>
              <DialogTitle>Add custom link</DialogTitle>
              <DialogDescription className='hidden'>
                Add a custom link to a streaming service of your choice
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-4 items-center gap-4'>
                    <FormLabel className='m-0 text-right'>Name</FormLabel>
                    <FormControl className='col-span-3'>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='baseUrl'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-4 items-center gap-4'>
                    <FormLabel className='m-0 text-right'>Base URL</FormLabel>
                    <FormControl className='col-span-3'>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='property'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-4 items-center gap-4'>
                    <FormLabel className='m-0 text-right'>Property</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='col-span-3 m-0'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='title'>Movie Title</SelectItem>
                        <SelectItem value='tmdbId'>TMDB ID</SelectItem>
                        <SelectItem value='imdbId'>IMDB ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='slug'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-4 items-center gap-4'>
                    <FormLabel className='m-0 text-right'>
                      Slugify value
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-readonly
                        className='m-0 h-7 w-12'
                        thumbClassName='h-6 w-6'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type='submit'>Add</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
