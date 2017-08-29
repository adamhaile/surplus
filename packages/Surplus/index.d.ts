export * from './es/Surplus';

// JSX type definitions for Surplus initially based on those for React v0.14
// React definitions by: Asana <https://asana.com>, AssureSign <http://www.assuresign.com>, Microsoft <https://microsoft.com>, John Reilly <https://github.com/johnnyreilly/>

declare global {
    namespace JSX {
		interface Element extends HTMLElement { }

        interface IntrinsicElements {
            // HTML
            a: HTMLAttributes<HTMLAnchorElement>;
            abbr: HTMLAttributes<HTMLElement>;
            address: HTMLAttributes<HTMLElement>;
            area: HTMLAttributes<HTMLAreaElement>;
            article: HTMLAttributes<HTMLElement>;
            aside: HTMLAttributes<HTMLElement>;
            audio: HTMLAttributes<HTMLAudioElement>;
            b: HTMLAttributes<HTMLElement>;
            base: HTMLAttributes<HTMLBaseElement>;
            bdi: HTMLAttributes<HTMLElement>;
            bdo: HTMLAttributes<HTMLElement>;
            big: HTMLAttributes<HTMLElement>;
            blockquote: HTMLAttributes<HTMLElement>;
            body: HTMLAttributes<HTMLBodyElement>;
            br: HTMLAttributes<HTMLBRElement>;
            button: HTMLAttributes<HTMLButtonElement>;
            canvas: HTMLAttributes<HTMLCanvasElement>;
            caption: HTMLAttributes<HTMLElement>;
            cite: HTMLAttributes<HTMLElement>;
            code: HTMLAttributes<HTMLElement>;
            col: HTMLAttributes<HTMLTableColElement>;
            colgroup: HTMLAttributes<HTMLTableColElement>;
            data: HTMLAttributes<HTMLElement>;
            datalist: HTMLAttributes<HTMLDataListElement>;
            dd: HTMLAttributes<HTMLElement>;
            del: HTMLAttributes<HTMLElement>;
            details: HTMLAttributes<HTMLElement>;
            dfn: HTMLAttributes<HTMLElement>;
            dialog: HTMLAttributes<HTMLElement>;
            div: HTMLAttributes<HTMLDivElement>;
            dl: HTMLAttributes<HTMLDListElement>;
            dt: HTMLAttributes<HTMLElement>;
            em: HTMLAttributes<HTMLElement>;
            embed: HTMLAttributes<HTMLEmbedElement>;
            fieldset: HTMLAttributes<HTMLFieldSetElement>;
            figcaption: HTMLAttributes<HTMLElement>;
            figure: HTMLAttributes<HTMLElement>;
            footer: HTMLAttributes<HTMLElement>;
            form: HTMLAttributes<HTMLFormElement>;
            h1: HTMLAttributes<HTMLHeadingElement>;
            h2: HTMLAttributes<HTMLHeadingElement>;
            h3: HTMLAttributes<HTMLHeadingElement>;
            h4: HTMLAttributes<HTMLHeadingElement>;
            h5: HTMLAttributes<HTMLHeadingElement>;
            h6: HTMLAttributes<HTMLHeadingElement>;
            head: HTMLAttributes<HTMLHeadElement>;
            header: HTMLAttributes<HTMLElement>;
            hgroup: HTMLAttributes<HTMLElement>;
            hr: HTMLAttributes<HTMLHRElement>;
            html: HTMLAttributes<HTMLHtmlElement>;
            i: HTMLAttributes<HTMLElement>;
            iframe: HTMLAttributes<HTMLIFrameElement>;
            img: HTMLAttributes<HTMLImageElement>;
            input: HTMLAttributes<HTMLInputElement>;
            ins: HTMLAttributes<HTMLModElement>;
            kbd: HTMLAttributes<HTMLElement>;
            keygen: HTMLAttributes<HTMLElement>;
            label: HTMLAttributes<HTMLLabelElement>;
            legend: HTMLAttributes<HTMLLegendElement>;
            li: HTMLAttributes<HTMLLIElement>;
            link: HTMLAttributes<HTMLLinkElement>;
            main: HTMLAttributes<HTMLElement>;
            map: HTMLAttributes<HTMLMapElement>;
            mark: HTMLAttributes<HTMLElement>;
            menu: HTMLAttributes<HTMLElement>;
            menuitem: HTMLAttributes<HTMLElement>;
            meta: HTMLAttributes<HTMLMetaElement>;
            meter: HTMLAttributes<HTMLElement>;
            nav: HTMLAttributes<HTMLElement>;
            noindex: HTMLAttributes<HTMLElement>;
            noscript: HTMLAttributes<HTMLElement>;
            object: HTMLAttributes<HTMLObjectElement>;
            ol: HTMLAttributes<HTMLOListElement>;
            optgroup: HTMLAttributes<HTMLOptGroupElement>;
            option: HTMLAttributes<HTMLOptionElement>;
            output: HTMLAttributes<HTMLElement>;
            p: HTMLAttributes<HTMLParagraphElement>;
            param: HTMLAttributes<HTMLParamElement>;
            picture: HTMLAttributes<HTMLElement>;
            pre: HTMLAttributes<HTMLPreElement>;
            progress: HTMLAttributes<HTMLProgressElement>;
            q: HTMLAttributes<HTMLQuoteElement>;
            rp: HTMLAttributes<HTMLElement>;
            rt: HTMLAttributes<HTMLElement>;
            ruby: HTMLAttributes<HTMLElement>;
            s: HTMLAttributes<HTMLElement>;
            samp: HTMLAttributes<HTMLElement>;
            script: HTMLAttributes<HTMLElement>;
            section: HTMLAttributes<HTMLElement>;
            select: HTMLAttributes<HTMLSelectElement>;
            small: HTMLAttributes<HTMLElement>;
            source: HTMLAttributes<HTMLSourceElement>;
            span: HTMLAttributes<HTMLSpanElement>;
            strong: HTMLAttributes<HTMLElement>;
            style: HTMLAttributes<HTMLStyleElement>;
            sub: HTMLAttributes<HTMLElement>;
            summary: HTMLAttributes<HTMLElement>;
            sup: HTMLAttributes<HTMLElement>;
            table: HTMLAttributes<HTMLTableElement>;
            tbody: HTMLAttributes<HTMLTableSectionElement>;
            td: HTMLAttributes<HTMLTableDataCellElement>;
            textarea: HTMLAttributes<HTMLTextAreaElement>;
            tfoot: HTMLAttributes<HTMLTableSectionElement>;
            th: HTMLAttributes<HTMLTableHeaderCellElement>;
            thead: HTMLAttributes<HTMLTableSectionElement>;
            time: HTMLAttributes<HTMLElement>;
            title: HTMLAttributes<HTMLTitleElement>;
            tr: HTMLAttributes<HTMLTableRowElement>;
            track: HTMLAttributes<HTMLTrackElement>;
            u: HTMLAttributes<HTMLElement>;
            ul: HTMLAttributes<HTMLUListElement>;
            "var": HTMLAttributes<HTMLElement>;
            video: HTMLAttributes<HTMLVideoElement>;
            wbr: HTMLAttributes<HTMLElement>;

            // SVG
            svg: SVGAttributes<SVGElement>;

            circle: SVGAttributes<SVGElement>;
            clipPath: SVGAttributes<SVGElement>;
            defs: SVGAttributes<SVGElement>;
            desc: SVGAttributes<SVGElement>;
            ellipse: SVGAttributes<SVGElement>;
            feBlend: SVGAttributes<SVGElement>;
            feColorMatrix: SVGAttributes<SVGElement>;
            feComponentTransfer: SVGAttributes<SVGElement>;
            feComposite: SVGAttributes<SVGElement>;
            feConvolveMatrix: SVGAttributes<SVGElement>;
            feDiffuseLighting: SVGAttributes<SVGElement>;
            feDisplacementMap: SVGAttributes<SVGElement>;
            feDistantLight: SVGAttributes<SVGElement>;
            feFlood: SVGAttributes<SVGElement>;
            feFuncA: SVGAttributes<SVGElement>;
            feFuncB: SVGAttributes<SVGElement>;
            feFuncG: SVGAttributes<SVGElement>;
            feFuncR: SVGAttributes<SVGElement>;
            feGaussianBlur: SVGAttributes<SVGElement>;
            feImage: SVGAttributes<SVGElement>;
            feMerge: SVGAttributes<SVGElement>;
            feMergeNode: SVGAttributes<SVGElement>;
            feMorphology: SVGAttributes<SVGElement>;
            feOffset: SVGAttributes<SVGElement>;
            fePointLight: SVGAttributes<SVGElement>;
            feSpecularLighting: SVGAttributes<SVGElement>;
            feSpotLight: SVGAttributes<SVGElement>;
            feTile: SVGAttributes<SVGElement>;
            feTurbulence: SVGAttributes<SVGElement>;
            filter: SVGAttributes<SVGElement>;
            foreignObject: SVGAttributes<SVGElement>;
            g: SVGAttributes<SVGElement>;
            image: SVGAttributes<SVGElement>;
            line: SVGAttributes<SVGElement>;
            linearGradient: SVGAttributes<SVGElement>;
            marker: SVGAttributes<SVGElement>;
            mask: SVGAttributes<SVGElement>;
            metadata: SVGAttributes<SVGElement>;
            path: SVGAttributes<SVGElement>;
            pattern: SVGAttributes<SVGElement>;
            polygon: SVGAttributes<SVGElement>;
            polyline: SVGAttributes<SVGElement>;
            radialGradient: SVGAttributes<SVGElement>;
            rect: SVGAttributes<SVGElement>;
            stop: SVGAttributes<SVGElement>;
            switch: SVGAttributes<SVGElement>;
            symbol: SVGAttributes<SVGElement>;
            text: SVGAttributes<SVGElement>;
            textPath: SVGAttributes<SVGElement>;
            tspan: SVGAttributes<SVGElement>;
            use: SVGAttributes<SVGElement>;
            view: SVGAttributes<SVGElement>;
        }

		interface EventHandler<T, E extends Event> {
			(e : E & { currentTarget: T }) : void;
		}

		interface SurplusAtributes<T> {
			ref?: T;
			fn?: <U>(node : T, state? : U) => any;
			fn0?: <U>(node : T, state? : U) => any;
			fn1?: <U>(node : T, state? : U) => any;
			fn2?: <U>(node : T, state? : U) => any;
			fn3?: <U>(node : T, state? : U) => any;
			fn4?: <U>(node : T, state? : U) => any;
			fn5?: <U>(node : T, state? : U) => any;
			fn6?: <U>(node : T, state? : U) => any;
			fn7?: <U>(node : T, state? : U) => any;
			fn8?: <U>(node : T, state? : U) => any;
			fn9?: <U>(node : T, state? : U) => any;
			fn10?: <U>(node : T, state? : U) => any;
			fn11?: <U>(node : T, state? : U) => any;
			fn12?: <U>(node : T, state? : U) => any;
			fn13?: <U>(node : T, state? : U) => any;
			fn14?: <U>(node : T, state? : U) => any;
			fn15?: <U>(node : T, state? : U) => any;
			fn16?: <U>(node : T, state? : U) => any;
			fn17?: <U>(node : T, state? : U) => any;
			fn18?: <U>(node : T, state? : U) => any;
			fn19?: <U>(node : T, state? : U) => any;
			fn20?: <U>(node : T, state? : U) => any;
		}

		interface DOMAttributes<T> extends SurplusAtributes<T> {

			// Clipboard Events
			onCopy?:                      EventHandler<T, ClipboardEvent>;
			onCopyCapture?:               EventHandler<T, ClipboardEvent>;
			onCut?:                       EventHandler<T, ClipboardEvent>;
			onCutCapture?:                EventHandler<T, ClipboardEvent>;
			onPaste?:                     EventHandler<T, ClipboardEvent>;
			onPasteCapture?:              EventHandler<T, ClipboardEvent>;

			// Composition Events
			onCompositionEnd?:            EventHandler<T, CompositionEvent>;
			onCompositionEndCapture?:     EventHandler<T, CompositionEvent>;
			onCompositionStart?:          EventHandler<T, CompositionEvent>;
			onCompositionStartCapture?:   EventHandler<T, CompositionEvent>;
			onCompositionUpdate?:         EventHandler<T, CompositionEvent>;
			onCompositionUpdateCapture?:  EventHandler<T, CompositionEvent>;

			// Focus Events
			onFocus?:                     EventHandler<T, FocusEvent>;
			onFocusCapture?:              EventHandler<T, FocusEvent>;
			onBlur?:                      EventHandler<T, FocusEvent>;
			onBlurCapture?:               EventHandler<T, FocusEvent>;

			// Form Events
			onChange?:                    EventHandler<T, Event>;
			onChangeCapture?:             EventHandler<T, Event>;
			onInput?:                     EventHandler<T, Event>;
			onInputCapture?:              EventHandler<T, Event>;
			onReset?:                     EventHandler<T, Event>;
			onResetCapture?:              EventHandler<T, Event>;
			onSubmit?:                    EventHandler<T, Event>;
			onSubmitCapture?:             EventHandler<T, Event>;

			// Image Events
			onLoad?:                      EventHandler<T, Event>;
			onLoadCapture?:               EventHandler<T, Event>;
			onError?:                     EventHandler<T, Event>; // also a Media Event
			onErrorCapture?:              EventHandler<T, Event>; // also a Media Event

			// Keyboard Events
			onKeyDown?:                   EventHandler<T, KeyboardEvent>;
			onKeyDownCapture?:            EventHandler<T, KeyboardEvent>;
			onKeyPress?:                  EventHandler<T, KeyboardEvent>;
			onKeyPressCapture?:           EventHandler<T, KeyboardEvent>;
			onKeyUp?:                     EventHandler<T, KeyboardEvent>;
			onKeyUpCapture?:              EventHandler<T, KeyboardEvent>;

			// Media Events
			onAbort?:                     EventHandler<T, Event>;
			onAbortCapture?:              EventHandler<T, Event>;
			onCanPlay?:                   EventHandler<T, Event>;
			onCanPlayCapture?:            EventHandler<T, Event>;
			onCanPlayThrough?:            EventHandler<T, Event>;
			onCanPlayThroughCapture?:     EventHandler<T, Event>;
			onDurationChange?:            EventHandler<T, Event>;
			onDurationChangeCapture?:     EventHandler<T, Event>;
			onEmptied?:                   EventHandler<T, Event>;
			onEmptiedCapture?:            EventHandler<T, Event>;
			onEncrypted?:                 EventHandler<T, Event>;
			onEncryptedCapture?:          EventHandler<T, Event>;
			onEnded?:                     EventHandler<T, Event>;
			onEndedCapture?:              EventHandler<T, Event>;
			onLoadedData?:                EventHandler<T, Event>;
			onLoadedDataCapture?:         EventHandler<T, Event>;
			onLoadedMetadata?:            EventHandler<T, Event>;
			onLoadedMetadataCapture?:     EventHandler<T, Event>;
			onLoadStart?:                 EventHandler<T, Event>;
			onLoadStartCapture?:          EventHandler<T, Event>;
			onPause?:                     EventHandler<T, Event>;
			onPauseCapture?:              EventHandler<T, Event>;
			onPlay?:                      EventHandler<T, Event>;
			onPlayCapture?:               EventHandler<T, Event>;
			onPlaying?:                   EventHandler<T, Event>;
			onPlayingCapture?:            EventHandler<T, Event>;
			onProgress?:                  EventHandler<T, Event>;
			onProgressCapture?:           EventHandler<T, Event>;
			onRateChange?:                EventHandler<T, Event>;
			onRateChangeCapture?:         EventHandler<T, Event>;
			onSeeked?:                    EventHandler<T, Event>;
			onSeekedCapture?:             EventHandler<T, Event>;
			onSeeking?:                   EventHandler<T, Event>;
			onSeekingCapture?:            EventHandler<T, Event>;
			onStalled?:                   EventHandler<T, Event>;
			onStalledCapture?:            EventHandler<T, Event>;
			onSuspend?:                   EventHandler<T, Event>;
			onSuspendCapture?:            EventHandler<T, Event>;
			onTimeUpdate?:                EventHandler<T, Event>;
			onTimeUpdateCapture?:         EventHandler<T, Event>;
			onVolumeChange?:              EventHandler<T, Event>;
			onVolumeChangeCapture?:       EventHandler<T, Event>;
			onWaiting?:                   EventHandler<T, Event>;
			onWaitingCapture?:            EventHandler<T, Event>;

			// MouseEvents
			onClick?:                     EventHandler<T, MouseEvent>;
			onClickCapture?:              EventHandler<T, MouseEvent>;
			onContextMenu?:               EventHandler<T, MouseEvent>;
			onContextMenuCapture?:        EventHandler<T, MouseEvent>;
			onDoubleClick?:               EventHandler<T, MouseEvent>;
			onDoubleClickCapture?:        EventHandler<T, MouseEvent>;
			onDrag?:                      EventHandler<T, DragEvent>;
			onDragCapture?:               EventHandler<T, DragEvent>;
			onDragEnd?:                   EventHandler<T, DragEvent>;
			onDragEndCapture?:            EventHandler<T, DragEvent>;
			onDragEnter?:                 EventHandler<T, DragEvent>;
			onDragEnterCapture?:          EventHandler<T, DragEvent>;
			onDragExit?:                  EventHandler<T, DragEvent>;
			onDragExitCapture?:           EventHandler<T, DragEvent>;
			onDragLeave?:                 EventHandler<T, DragEvent>;
			onDragLeaveCapture?:          EventHandler<T, DragEvent>;
			onDragOver?:                  EventHandler<T, DragEvent>;
			onDragOverCapture?:           EventHandler<T, DragEvent>;
			onDragStart?:                 EventHandler<T, DragEvent>;
			onDragStartCapture?:          EventHandler<T, DragEvent>;
			onDrop?:                      EventHandler<T, DragEvent>;
			onDropCapture?:               EventHandler<T, DragEvent>;
			onMouseDown?:                 EventHandler<T, MouseEvent>;
			onMouseDownCapture?:          EventHandler<T, MouseEvent>;
			onMouseEnter?:                EventHandler<T, MouseEvent>;
			onMouseLeave?:                EventHandler<T, MouseEvent>;
			onMouseMove?:                 EventHandler<T, MouseEvent>;
			onMouseMoveCapture?:          EventHandler<T, MouseEvent>;
			onMouseOut?:                  EventHandler<T, MouseEvent>;
			onMouseOutCapture?:           EventHandler<T, MouseEvent>;
			onMouseOver?:                 EventHandler<T, MouseEvent>;
			onMouseOverCapture?:          EventHandler<T, MouseEvent>;
			onMouseUp?:                   EventHandler<T, MouseEvent>;
			onMouseUpCapture?:            EventHandler<T, MouseEvent>;

			// Selection Events
			onSelect?:                    EventHandler<T, Event>;
			onSelectCapture?:             EventHandler<T, Event>;

			// Touch Events
			onTouchCancel?:               EventHandler<T, TouchEvent>;
			onTouchCancelCapture?:        EventHandler<T, TouchEvent>;
			onTouchEnd?:                  EventHandler<T, TouchEvent>;
			onTouchEndCapture?:           EventHandler<T, TouchEvent>;
			onTouchMove?:                 EventHandler<T, TouchEvent>;
			onTouchMoveCapture?:          EventHandler<T, TouchEvent>;
			onTouchStart?:                EventHandler<T, TouchEvent>;
			onTouchStartCapture?:         EventHandler<T, TouchEvent>;

			// UI Events
			onScroll?:                    EventHandler<T, UIEvent>;
			onScrollCapture?:             EventHandler<T, UIEvent>;

			// Wheel Events
			onWheel?:                     EventHandler<T, WheelEvent>;
			onWheelCapture?:              EventHandler<T, WheelEvent>;

			// Animation Events
			onAnimationStart?:            EventHandler<T, AnimationEvent>;
			onAnimationStartCapture?:     EventHandler<T, AnimationEvent>;
			onAnimationEnd?:              EventHandler<T, AnimationEvent>;
			onAnimationEndCapture?:       EventHandler<T, AnimationEvent>;
			onAnimationIteration?:        EventHandler<T, AnimationEvent>;
			onAnimationIterationCapture?: EventHandler<T, AnimationEvent>;

			// Transition Events
			onTransitionEnd?:             EventHandler<T, TransitionEvent>;
			onTransitionEndCapture?:      EventHandler<T, TransitionEvent>;
		}

		interface HTMLAttributes<T> extends DOMAttributes<T> {
			// Standard HTML Attributes
			accept?: string;
			acceptCharset?: string;
			accessKey?: string;
			action?: string;
			allowFullScreen?: boolean;
			allowTransparency?: boolean;
			alt?: string;
			async?: boolean;
			autoComplete?: string;
			autoFocus?: boolean;
			autoPlay?: boolean;
			capture?: boolean;
			cellPadding?: number | string;
			cellSpacing?: number | string;
			charSet?: string;
			challenge?: string;
			checked?: boolean;
			classID?: string;
			className?: string;
			cols?: number;
			colSpan?: number;
			content?: string;
			contentEditable?: boolean;
			contextMenu?: string;
			controls?: boolean;
			coords?: string;
			crossOrigin?: string;
			data?: string;
			dateTime?: string;
			default?: boolean;
			defer?: boolean;
			dir?: string;
			disabled?: boolean;
			download?: any;
			draggable?: boolean;
			encType?: string;
			form?: string;
			formAction?: string;
			formEncType?: string;
			formMethod?: string;
			formNoValidate?: boolean;
			formTarget?: string;
			frameBorder?: number | string;
			headers?: string;
			height?: number | string;
			hidden?: boolean;
			high?: number;
			href?: string;
			hrefLang?: string;
			htmlFor?: string;
			httpEquiv?: string;
			id?: string;
			innerText?: string | number;
			inputMode?: string;
			integrity?: string;
			is?: string;
			keyParams?: string;
			keyType?: string;
			kind?: string;
			label?: string;
			lang?: string;
			list?: string;
			loop?: boolean;
			low?: number;
			manifest?: string;
			marginHeight?: number;
			marginWidth?: number;
			max?: number | string;
			maxLength?: number;
			media?: string;
			mediaGroup?: string;
			method?: string;
			min?: number | string;
			minLength?: number;
			multiple?: boolean;
			muted?: boolean;
			name?: string;
			nonce?: string;
			noValidate?: boolean;
			open?: boolean;
			optimum?: number;
			pattern?: string;
			placeholder?: string;
			playsInline?: boolean;
			poster?: string;
			preload?: string;
			radioGroup?: string;
			readOnly?: boolean;
			rel?: string;
			required?: boolean;
			reversed?: boolean;
			role?: string;
			rows?: number;
			rowSpan?: number;
			sandbox?: string;
			scope?: string;
			scoped?: boolean;
			scrolling?: string;
			seamless?: boolean;
			selected?: boolean;
			shape?: string;
			size?: number;
			sizes?: string;
			span?: number;
			spellCheck?: boolean;
			src?: string;
			srcDoc?: string;
			srcLang?: string;
			srcSet?: string;
			start?: number;
			step?: number | string;
			style?: CSSStyleDeclaration;
			summary?: string;
			tabIndex?: number;
			target?: string;
			title?: string;
			type?: string;
			useMap?: string;
			value?: string | string[] | number;
			width?: number | string;
			wmode?: string;
			wrap?: string;

			// RDFa Attributes
			about?: string;
			datatype?: string;
			inlist?: any;
			prefix?: string;
			property?: string;
			resource?: string;
			typeof?: string;
			vocab?: string;

			// Non-standard Attributes
			autoCapitalize?: string;
			autoCorrect?: string;
			autoSave?: string;
			color?: string;
			itemProp?: string;
			itemScope?: boolean;
			itemType?: string;
			itemID?: string;
			itemRef?: string;
			results?: number;
			security?: string;
			unselectable?: boolean;
		}

		interface SVGAttributes<T> extends HTMLAttributes<T> {
			clipPath?: string;
			colorInterpolationFilters?: "auto" | "sRGB" | "linearRGB" | "inherit";
			cx?: number | string;
			cy?: number | string;
			d?: string;
			dx?: number | string;
			dy?: number | string;
			fill?: string;
			fillOpacity?: number | string;
			fillRule?: "nonzero" | "evenodd" | "inherit";
			filter?: string;
			fontFamily?: string;
			fontSize?: number | string;
			fx?: number | string;
			fy?: number | string;
			gradientTransform?: string;
			gradientUnits?: string;
			in?: string;
			markerEnd?: string;
			markerMid?: string;
			markerStart?: string;
			mask?: string;
			offset?: number | string;
			opacity?: number | string;
			patternContentUnits?: string;
			patternUnits?: string;
			points?: string;
			preserveAspectRatio?: string;
			r?: number | string;
			result?: string;
			rx?: number | string;
			ry?: number | string;
			spreadMethod?: string;
			stdDeviation?: number | string
			stopColor?: string;
			stopOpacity?: number | string;
			stroke?: string;
			strokeDasharray?: string | number;
			strokeDashoffset?: string | number;
			strokeLinecap?: "butt" | "round" | "square" | "inherit";
			strokeLinejoin?: "miter" | "round" | "bevel" | "inherit";
			strokeMiterlimit?: string;
			strokeOpacity?: number | string;
			strokeWidth?: number | string;
			textAnchor?: string;
			transform?: string;
			type?: string;
			values?: string;
			version?: string;
			viewBox?: string;
			x1?: number | string;
			x2?: number | string;
			x?: number | string;
			xChannelSelector?: string;
			xlinkActuate?: string;
			xlinkArcrole?: string;
			xlinkHref?: string;
			xlinkRole?: string;
			xlinkShow?: string;
			xlinkTitle?: string;
			xlinkType?: string;
			xmlBase?: string;
			xmlLang?: string;
			xmlns?: string;
			xmlnsXlink?: string;
			xmlSpace?: string;
			y1?: number | string;
			y2?: number | string;
			y?: number | string;
			yChannelSelector?: string;
			z?: number | string;
			zoomAndPan?: string;
		}
    }
}
