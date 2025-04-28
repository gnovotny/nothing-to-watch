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
import { ScrollArea } from '../../ui/scroll-area'

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

const ToggleVoroforceDevMode = () => {
  const { voroforceDevModeEnabled, setVoroforceDevModeEnabled } = store()

  return (
    <Button
      onClick={() => setVoroforceDevModeEnabled(!voroforceDevModeEnabled)}
      size='sm'
      className='mx-1 cursor-pointer'
    >
      Toggle
    </Button>
  )
}

const items = [
  {
    title: 'About',
    content: (
      <>
        <p>
          The silver screen's heyday is arguably behind us. Luckily, we have
          over one hundred years of cinema to fall back on.
        </p>
        <br />
        <p>
          Presenting the 50,000 most <i>popular*</i> movies according to{' '}
          <Link href={config.tmdbUrl}>TMDB</Link>. Data cut-off is early 2025.
          Sorted by popularity in descending order, starting from the center of
          the grid and moving outwards.
        </p>
        <br />
        <p>
          <small>
            <i>*Not to be confused with the highest rated movies</i>
          </small>
        </p>
      </>
    ),
  },
  {
    title: 'Technical TL;DR',
    content: (
      <p>
        This is an experimental gallery that can visualize tens of thousands of
        images as a voronoi diagram. The voronoi seeds are generated via a
        custom grid-constrained force graph layout. The simulation layer runs in
        javascript and supports multithreading while the visualization layer
        uses webgl2
      </p>
    ),
  },
  {
    title: 'Voronoi',
    content: (
      <>
        <p>
          <Link href='https://en.wikipedia.org/wiki/Voronoi_diagram'>
            Voronoi
          </Link>{' '}
          are cool. Once you become aware of them, you'll begin recognizing them
          in many places: from{' '}
          <Link href='https://www.google.com/search?q=examples+of+voronoi+patterns+in+nature'>
            nature
          </Link>{' '}
          to art and architecture. But apart from being aesthetically pleasing
          to some of us, they don't really have a solid use case in user
          interfaces. This is an attempt to give them one, though a similar
          effect could admittedly be achieved by distorting a grid{' '}
        </p>
        <br />
        <p>
          It should be noted that this is not a typical voronoi diagram. The
          cells are constrained to a grid, making them extremely uniform. The
          focused "center" cell has a slightly higher weight to reduce the
          enlargement of neighboring cells. In order to account for the additive
          weighting while also maintaining cell aspect ratio, the distance
          metric has a 1.5x bias on the y-component.
        </p>
        <br />
        <p>
          You can press <ToggleVoroforceDevMode /> to see the voronoi cell
          seeds.
        </p>
      </>
    ),
  },
  {
    title: 'Force-directed graph layout',
    content: (
      <>
        <p>
          The force simulation runs on the CPU in a javascript web worker. It is
          heavily inspired by{' '}
          <Link href='https://github.com/d3/d3-force'>d3-force</Link>.
        </p>
        <br />
        <p>
          The simulation could potentially be implemented on the GPU with WebGl.
          WebGPU would be a better choice though, once it achieves widespread
          adoption.
        </p>
        <br />
        <p>
          If kept on the CPU, there could be massive performance gains by only
          simulating a subset of the cells and interpolating the rest.
        </p>
      </>
    ),
  },
  {
    title: 'Shaders',
    content: (
      <>
        <p>
          Much of the shader code is heavily inspired by - if not blatantly
          copy-pasted - various brilliant creators on{' '}
          <Link href='https://shadertoy.com'>Shadertoy</Link>
        </p>
        <br />
      </>
    ),
  },
  {
    title: 'Visualizing large image datasets',
    content: (
      <>
        <p>
          The film posters are packed into image montages aka texture atlases.
          The montages are in turn served on demand as compressed textures.
          There are multiple quality levels and a set of montages for each, with
          the lowest quality level delivering image sizes of only 4x6 pixels
        </p>
        <br />
        <p>
          If you're interested in visualizing tens of thousands of images but
          you find this project to be a little bit silly, then check out the
          (unrelated) project{' '}
          <Link href='https://github.com/pleonard212/pix-plot'>pix-plot</Link>.
        </p>
      </>
    ),
  },
  {
    title: 'Acknowledgements',
    content: (
      <>
        <p>
          Much of the shader code is heavily inspired - if not blatantly
          copy-pasted - by multiple brilliant creators on{' '}
          <Link href='https://shadertoy.com'>Shadertoy</Link>
        </p>
        <br />
        <p>
          <Link href='https://www.kaggle.com/datasets/asaniczka/tmdb-movies-dataset-2023-930k-movies/data'>
            Kaggle's TMDB Movies Dataset
          </Link>
        </p>
      </>
    ),
  },
  {
    title: 'Disclaimer',
    content: (
      <>
        <p>
          Much of the shader code is heavily inspired - if not blatantly
          copy-pasted - by various brilliant creators on{' '}
          <Link href='https://shadertoy.com'>Shadertoy</Link>
        </p>
        <br />
        <p>
          The Dataset is made available under the{' '}
          <Link href='http://opendatacommons.org/licenses/by/1.0/'>
            Open Data Commons Attribution License
          </Link>{' '}
          and sourced from{' '}
          <Link href='https://www.kaggle.com/datasets/asaniczka/tmdb-movies-dataset-2023-930k-movies/data'>
            Kaggle's TMDB Movies Dataset
          </Link>
        </p>
      </>
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
          <ScrollArea className='not-landscape:w-full lg:w-full lg:pt-12 landscape:h-full'>
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
                  key={index}
                  value={`${index}`}
                  className='w-full cursor-auto'
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
          </ScrollArea>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  )
}
