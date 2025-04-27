import { GithubIcon } from 'lucide-react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { useShallow } from 'zustand/react/shallow'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/cmp/ui/accordion'

import { useMediaQuery } from '@/hk/use-media-query'
import { orientation } from '@/utl/mq'
import config from '../../../config'
import { cn } from '@/utl/tw'
import { Button } from '../../ui/button'
import {
  Drawer,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from '../../ui/drawer'
import { store } from '@/store'
import { type PropsWithChildren, useState } from 'react'

const Link = ({ children, href }: PropsWithChildren<{ href: string }>) => (
  <a
    href={href}
    target='_blank'
    rel='noreferrer noopener noreferer'
    className='font-bold underline underline-offset-2'
  >
    {children}
  </a>
)

const items = [
  {
    title: 'About',
    content: (
      <p>
        The 50,000 most <i>popular*</i> movies according to{' '}
        <Link href={config.tmdbUrl}>TMDB</Link>. Sorted by descending
        popularity, starting from the center of the grid and moving outwards.
        <br />
        <br />
        <small>
          <i>*Not to be confused with the highest rated movies</i>
        </small>
      </p>
    ),
  },
  {
    title: 'Technical TL;DR',
    content: (
      <p>
        This is an experimental gallery that can visualize tens of thousands of
        images as a voronoi diagram that is in turn based on a grid-constrained
        force graph layout. The simulation layer runs in javascript and supports
        multithreading while the visualization layer uses webgl2
      </p>
    ),
  },
  {
    title: 'Voronoi',
    content: (
      <>
        <p>
          I find{' '}
          <Link href='https://en.wikipedia.org/wiki/Voronoi_diagram'>
            voronoi
          </Link>{' '}
          interesting. Once you become aware of them, you'll begin recognizing
          them in many places: from nature to art to architecture. But apart
          from being aesthetically pleasing to some of us, they don't really
          have a solid use case when designing user interfaces. This is an
          attempt to give them a use case, though a similar effect could
          admittedly be achieved by distorting a grid{' '}
        </p>
        <br />
        <p>
          It should be noted that this is not a standard voronoi diagram, with
          the focused cell having a slightly higher weight. Additionally, the
          distance metric Y-Component has a 1.5x bias.
        </p>
        <br />
        <p>You can TOGGLE here to see the cell seeds.</p>
      </>
    ),
  },
  {
    title: 'Force-directed graph layout',
    content: (
      <p>
        The force simulation is on the CPU and runs in javascript as a web
        worker. It is highly inspired by{' '}
        <Link href='https://github.com/d3/d3-force'>d3-force</Link>. Could also
        be implemented on the GPU with WebGl, but I don't see myself ever doing
        that. Maybe with WebGPU once it goes mainstream.
      </p>
    ),
  },
  {
    title: 'Visualizing large image datasets',
    content: (
      <p>
        If you're interested in visualizing tens of thousands of images but you
        find this project to be a little bit silly, then check out{' '}
        <Link href='https://github.com/pleonard212/pix-plot'>pix-plot</Link>. No
        relation with this project, apart from being able to visualize a similar
        amount of images.
      </p>
    ),
  },
]

export const About = () => {
  const landscape = useMediaQuery(orientation('landscape'))

  const { open, setOpen } = store(
    useShallow((state) => ({
      open: state.aboutOpen,
      setOpen: state.setAboutOpen,
    })),
  )

  const [isDragging, setIsDragging] = useState(false)

  return (
    <Drawer
      open={open}
      direction={landscape ? 'right' : 'bottom'}
      disablePreventScroll
      shouldScaleBackground={false}
      onClose={() => setOpen(false)}
      onDrag={() => setIsDragging(true)}
      onRelease={() => setIsDragging(false)}
    >
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerPrimitive.Content
          className={cn(
            '!pointer-events-auto fixed not-landscape:inset-x-0 not-landscape:bottom-0 z-50 not-landscape:mt-24 flex not-landscape:h-auto cursor-grab not-landscape:flex-col not-landscape:rounded-t-lg border bg-background lg:w-[800px] lg:max-w-1/2 landscape:inset-y landscape:top-0 landscape:right-0 landscape:h-full landscape:flex-row landscape:rounded-l-lg',
            {
              'cursor-grabbing': isDragging,
            },
          )}
        >
          <div className='not-landscape:mx-auto not-landscape:mt-4 not-landscape:h-2 not-landscape:w-[100px] rounded-full bg-muted landscape:my-auto landscape:ml-4 landscape:h-[100px] landscape:w-2' />
          <div className='not-landscape:w-full lg:w-full lg:pt-12 landscape:h-full'>
            <DrawerHeader className='sr-only'>
              <DrawerTitle>About</DrawerTitle>
              <DrawerDescription>About</DrawerDescription>
            </DrawerHeader>
            <Accordion
              type='multiple'
              className='w-full p-6 pr-10'
              defaultValue={['0']}
            >
              {items.map(({ title, content }, index) => (
                <AccordionItem
                  // biome-ignore lint/suspicious/noArrayIndexKey: annoying
                  key={index}
                  value={`${index}`}
                  className='w-full'
                >
                  <AccordionTrigger className='w-full cursor-pointer font-bold text-lg uppercase underline-offset-3 [&>svg]:size-6'>
                    {title}
                  </AccordionTrigger>
                  <AccordionContent className='text-base'>
                    {content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className='flex flex-col gap-3 p-4 pb-0'>
              <Button
                variant='ghost'
                size='icon'
                asChild
                className='!size-8 [&_svg]:!size-6 pointer-events-auto rounded-full'
              >
                <Link href={config.githubUrl}>
                  <GithubIcon />
                </Link>
              </Button>
            </div>
            <DrawerFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Close
              </Button>
            </DrawerFooter>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  )
}
