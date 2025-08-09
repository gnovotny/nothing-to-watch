import { GithubIcon } from 'lucide-react'

import { store, useShallowState } from '@/store'
import type { PropsWithChildren } from 'react'
import config from '../../../config'
import { Modal } from '../../common/modal'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../ui/accordion'
import { Button } from '../../ui/button'
import { ScrollArea } from '../../ui/scroll-area'
import { Hotkeys } from '../../common/hotkeys'
import { cn } from '../../../utils/tw'

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
  const { voroforceDevSceneEnabled, setVoroforceDevSceneEnabled } = store()

  return (
    <Button
      onClick={() => setVoroforceDevSceneEnabled(!voroforceDevSceneEnabled)}
      size='sm'
      className='mx-1 cursor-pointer'
    >
      Toggle
    </Button>
  )
}

const items = [
  {
    title: 'Copyright Disclaimer',
    content: (
      <>
        <p>
          <b>This is a non-commercial project</b>. The content is intended
          solely for educational and informational purposes. All rights to the
          materials used remain with their respective owners. I do not claim
          ownership of any third-party content. If you are the rightful owner of
          any material featured here and have concerns about its use, please{' '}
          <Link href={`mailto:${config.contactEmail}`}>contact</Link> me - I
          will address the issue promptly.
        </p>
        <br />
        <p>
          The dataset is made available under the{' '}
          <Link href='http://opendatacommons.org/licenses/by/1.0/'>
            Open Data Commons Attribution License
          </Link>{' '}
          and is sourced from{' '}
          <Link href='https://www.kaggle.com/datasets/asaniczka/tmdb-movies-dataset-2023-930k-movies/data'>
            Kaggle's TMDB Movies Dataset
          </Link>
        </p>
        <br />
        <p>
          Much of the shader code is heavily inspired by - and in some cases
          directly copied from - the work of talented creators on{' '}
          <Link href='https://shadertoy.com'>Shadertoy</Link>. Many of the
          underlying algorithms they use are themselves adapted from other
          sources.
        </p>
      </>
    ),
  },
  {
    title: 'About',
    content: (
      <>
        <p>
          The silver screen's heyday is arguably behind us. Luckily, we have
          over a hundred years of cinema to fall back on.
        </p>
        <br />
        <p>
          This gallery features a collection of the 50,000 most <i>popular*</i>{' '}
          movies according to <Link href={config.tmdbUrl}>TMDB</Link>, with data
          current as of early 2025. The movies are sorted by popularity in
          descending order, starting from the center of the grid and moving
          outward.
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
    title: 'Controls',
    content: <Hotkeys />,
    className: 'hidden mouse:block',
  },
  {
    title: 'Technical TL;DR',
    content: (
      <>
        <p>
          This is an experimental gallery designed to visualize tens of
          thousands of images as a Voronoi diagram. The Voronoi seeds are
          generated using a custom grid-constrained force graph layout. The
          simulation layer runs in JavaScript with multithreading support, while
          the visualization layer uses WebGL2.
        </p>
        <br />
        <Button variant='default' asChild>
          <a
            href={config.sourceCodeUrl}
            target='_blank'
            rel='noreferrer noopener noreferer'
          >
            <GithubIcon /> Source code
          </a>
        </Button>
      </>
    ),
  },
  {
    title: 'Voronoi',
    content: (
      <>
        <p>
          <Link href='https://en.wikipedia.org/wiki/Voronoi_diagram'>
            Voronoi diagrams
          </Link>{' '}
          are fascinating. Once you're aware of them, you'll start noticing them
          everywhere - from{' '}
          <Link href='https://www.google.com/search?q=examples+of+voronoi+patterns+in+nature'>
            nature
          </Link>{' '}
          to art and architecture. While they’re aesthetically pleasing, they
          haven’t traditionally had a strong use case in user interfaces. This
          is an attempt to give them one - though admittedly, a similar effect
          could be achieved by simply distorting a grid.
        </p>
        <br />
        <p>
          It’s worth noting that this is not a typical Voronoi diagram. The
          seeds are loosely constrained to a grid, which makes the resulting
          cells fairly uniform. The distance metric is biased 1.5x along the
          y-axis. Depending on the view mode, there are also cell weights and
          various distortion effects.
        </p>
        <br />
        <p className='hidden md:inline-block'>
          You can <ToggleVoroforceDevMode /> to see the Voronoi cell seeds but
          depending on the level of distortion these may not be representative
          of the actual Voronoi diagram.
        </p>
      </>
    ),
  },
  {
    title: 'Force-directed graph layout',
    content: (
      <>
        <p>
          The force simulation runs on the CPU in a JavaScript web worker. It's
          heavily inspired by{' '}
          <Link href='https://github.com/d3/d3-force'>D3-force</Link> and its
          use of velocity Verlet integration.
        </p>
        <br />
        <p>
          The simulation could potentially be implemented on the GPU with WebGL
          - though WebGPU would be a better fit once it gains broader adoption.
        </p>
        <br />
        <p>
          Alternatively, potential performance gains could be achieved by
          simulating only a subset of the cells and interpolating the rest.{' '}
        </p>
      </>
    ),
  },
  {
    title: 'Shaders',
    content: (
      <>
        <p>
          Many of the shader algorithms draw heavy inspiration from - if not
          directly reinterpret - the work of several brilliant creators on{' '}
          <Link href='https://shadertoy.com'>Shadertoy</Link>.
        </p>
        <br />
        <p>
          The{' '}
          <Link href='https://en.wikipedia.org/wiki/Jump_flooding_algorithm'>
            Jump Flooding algorithm
          </Link>
          is not employed. Instead, the Voronoi diagram is generated in a single
          pass through a two-pronged approach: comparing distances with
          immediate grid neighbors and with additional neighbors located within
          a small pixel-radius search area. Although cell propagation is
          relatively slow, this can be reasonably masked using simulation speed
          limits and other visual tricks.
        </p>
      </>
    ),
  },
  {
    title: 'Visualizing large image datasets',
    content: (
      <>
        <p>
          The film posters are packed into image montages, also known as texture
          atlases. These montages are served on demand as compressed textures,
          with multiple quality levels available. The lowest quality level
          delivers images as small as 4×6 pixels.
        </p>
        <br />
        <p className='pb-6'>
          If you're just interested in visualizing large amounts of images but
          find this project a bit silly, check out the (unrelated) project{' '}
          <Link href='https://github.com/pleonard212/pix-plot'>pix-plot</Link>.
        </p>
      </>
    ),
  },
]

export const About = () => {
  const { open, setOpen } = useShallowState((state) => ({
    open: state.aboutOpen,
    setOpen: state.setAboutOpen,
  }))

  return (
    <Modal
      rootProps={{
        open: open,
        onClose: () => setOpen(false),
      }}
      overlay
      header={
        <div className='flex h-18 w-full bg-gradient-to-t from-0% from-transparent via-60% via-background to-100% to-background max-md:hidden' />
      }
      footer={
        <div className='flex w-full flex-row justify-between gap-3 bg-gradient-to-b from-0% from-transparent via-60% via-background to-100% to-background p-6 pt-24 md:gap-6'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      }
    >
      <ScrollArea
        className='not-landscape:w-full not-landscape:rounded-t-3xl bg-background/60 lg:w-full lg:rounded-3xl landscape:h-full landscape:rounded-l-3xl'
        innerClassName='max-h-[calc(100vh-var(--spacing)*6*2)]'
      >
        <Accordion
          type='multiple'
          className='w-full p-6 pb-18 md:pr-10 lg:pt-12 lg:pb-24'
          defaultValue={['1', '2', '3']}
        >
          {items.map(({ title, content, className }, index) => (
            <AccordionItem
              key={title}
              value={`${index}`}
              className={cn('w-full cursor-auto', className)}
            >
              <AccordionTrigger className='w-full cursor-pointer font-bold text-lg uppercase leading-none underline-offset-3 [&>svg]:size-6'>
                {title}
              </AccordionTrigger>
              <AccordionContent className='text-base'>
                {content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </Modal>
  )
}
