import { GithubIcon } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../ui/accordion'
import config from '../../../config'
import { Button } from '../../ui/button'
import { store, useShallowState } from '@/store'
import type { PropsWithChildren } from 'react'
import { ScrollArea } from '../../ui/scroll-area'
import { Modal } from '../../common/modal'

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
    title: 'Copyright Disclaimer',
    content: (
      <>
        <p>
          <b>This is not a commercial project</b>. The content used is intended
          for educational and informational purposes only. All rights to the
          materials used belong to their respective owners. I do not claim
          ownership over any content used. If you are the rightful owner of any
          material used and have a concern about its use, please{' '}
          <Link href={`mailto:${config.relayEmail}`}>contact</Link> me and I
          will address it promptly.
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
        <br />
        <p>
          Much of the shader code is heavily inspired - if not blatantly
          copy-pasted - by various brilliant creators on{' '}
          <Link href='https://shadertoy.com'>Shadertoy</Link>. Many of the
          employed algorithms on Shadertoy are in turn sourced from other
          authors.
        </p>
      </>
    ),
  },
  {
    title: 'About',
    content: (
      <>
        <p>
          The silver screen's heyday is arguably behind us. Luckily, there's
          over a hundred years of cinema to fall back on.
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
      <>
        <p>
          This is an experimental gallery that can visualize tens of thousands
          of images as a voronoi diagram. The voronoi seeds are generated via a
          custom grid-constrained force graph layout. The simulation layer runs
          in javascript and supports multithreading while the visualization
          layer uses webgl2
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
          It should be noted that this is not a standard voronoi diagram. The
          cell seeds are constrained to a grid, making them the resulting cells
          extremely uniform. The focused center cell has a slightly higher
          weight to reduce the enlargement of neighboring cells. In order to
          account for the additive weighting while also maintaining cell aspect
          ratio, the distance metric has a 1.5x bias on the y-component.
        </p>
        <br />
        <p className='hidden md:inline-block'>
          You can <ToggleVoroforceDevMode /> to see the voronoi cell seeds.
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
          rehashed - various brilliant creators on{' '}
          <Link href='https://shadertoy.com'>Shadertoy</Link>, though many of
          their algorithms are in turn sourced from elsewhere.
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
          defaultValue={['1', '2']}
        >
          {items.map(({ title, content }, index) => (
            <AccordionItem
              key={index}
              value={`${index}`}
              className='w-full cursor-auto'
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
