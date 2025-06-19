import { valibotResolver } from '@hookform/resolvers/valibot'
import * as v from 'valibot'
import { DialogFooter } from '../../../ui/dialog'

import { useForm } from 'react-hook-form'
import { useShallowState } from '../../../../store'
import { Modal } from '../../../common/modal'
import { Button } from '../../../ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '../../../ui/form'
import { Input } from '../../../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../ui/select'
import { Switch } from '../../../ui/switch'
import {} from '../../../ui/tooltip'

enum Property {
  Title = 'title',
  ImdbId = 'imdbId',
  TmdbId = 'tmdbId',
}

const formSchema = v.object({
  name: v.string(),
  baseUrl: v.string(),
  property: v.enum(Property),
  slug: v.boolean(),
})

type FormData = v.InferOutput<typeof formSchema>

export function AddCustomLinkModal() {
  const { userConfig, setUserConfig, newLinkTypeOpen, setNewLinkTypeOpen } =
    useShallowState((state) => ({
      userConfig: state.userConfig,
      setUserConfig: state.setUserConfig,
      newLinkTypeOpen: state.newLinkTypeOpen,
      setNewLinkTypeOpen: state.setNewLinkTypeOpen,
    }))

  const form = useForm<FormData>({
    resolver: valibotResolver(formSchema),
    defaultValues: {
      property: Property.Title,
      slug: false,
    },
  })

  function onSubmit(values: FormData) {
    const customLinks = userConfig.customLinks ?? []
    const sameNameIndex = customLinks.findIndex(
      ({ name }) => name === values.name,
    )
    if (sameNameIndex === -1) {
      customLinks.push(values)
    } else {
      customLinks[sameNameIndex] = values
    }
    setUserConfig({
      ...userConfig,
      customLinks: [...customLinks],
    })
    form.reset()
    setNewLinkTypeOpen(false)
  }

  return (
    <Modal
      rootProps={{
        open: newLinkTypeOpen,
        onOpenChange: setNewLinkTypeOpen,
        direction: 'left',
      }}
      contentProps={{
        // className: '!top-auto bottom-0',
        className: '!absolute !top-full pt-0 lg:pt-0',
      }}
      innerContentProps={{
        className: 'bg-background p-6 xl:p-9 border',
      }}
      overlay
      portal={false}
      handle={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className=''>
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
    </Modal>
  )
}
