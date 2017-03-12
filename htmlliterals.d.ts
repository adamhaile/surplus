interface Html {
	insert(node : HTMLElement, value : any, state : HTMLElement) : HTMLElement;
	data(data : (v? : any) => any, event? : string) : HtmlMixin;
	focus(flag : Boolean, start? : number, end? : number) : HtmlMixin;
	onkey : {
		(key : string, callback : (key : KeyboardEvent) => void) : HtmlMixin;
		(key : string, event : string, callback : (key : KeyboardEvent) => void) : HtmlMixin;
	};
	class : {
		(name : string, flag : Boolean) : void;
		(name : string, alternate : string, flag : Boolean) : HtmlMixin;
	};
	exec(fn : (state? : any) => any) : any;
	cleanup(fn : () => void) : void;
}

interface HtmlMixin {
	(node : HTMLElement, state : any) : any;
}

declare var Html : Html;

export = Html;

// JSX type definitions for HTMLLiterals based on those for React v0.14
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

		interface EventHandler<T extends Event> {
			(e : T) : void;
		}

		interface SurplusAtributes<T> {
			(node : T, state? : any) : any;
			ref?: T;
		}

		interface DOMAttributes<T> extends SurplusAtributes<T> {

			// Clipboard Events
			onCopy?:         EventHandler<ClipboardEvent>;
			onCopyCapture?:  EventHandler<ClipboardEvent>;
			onCut?:          EventHandler<ClipboardEvent>;
			onCutCapture?:   EventHandler<ClipboardEvent>;
			onPaste?:        EventHandler<ClipboardEvent>;
			onPasteCapture?: EventHandler<ClipboardEvent>;

			// Composition Events
			onCompositionEnd?:           EventHandler<CompositionEvent>;
			onCompositionEndCapture?:    EventHandler<CompositionEvent>;
			onCompositionStart?:         EventHandler<CompositionEvent>;
			onCompositionStartCapture?:  EventHandler<CompositionEvent>;
			onCompositionUpdate?:        EventHandler<CompositionEvent>;
			onCompositionUpdateCapture?: EventHandler<CompositionEvent>;

			// Focus Events
			onFocus?:        EventHandler<FocusEvent>;
			onFocusCapture?: EventHandler<FocusEvent>;
			onBlur?:         EventHandler<FocusEvent>;
			onBlurCapture?:  EventHandler<FocusEvent>;

			// Form Events
			//onChange?:        EventHandler<FormEvent>;
			//onChangeCapture?: EventHandler<FormEvent>;
			//onInput?:         EventHandler<FormEvent>;
			//onInputCapture?:  EventHandler<FormEvent>;
			//onReset?:         EventHandler<FormEvent>;
			//onResetCapture?:  EventHandler<FormEvent>;
			//onSubmit?:        EventHandler<FormEvent>;
			//onSubmitCapture?: EventHandler<FormEvent>;

			// Image Events
			onLoad?:         EventHandler<Event>;
			onLoadCapture?:  EventHandler<Event>;
			onError?:        EventHandler<Event>; // also a Media Event
			onErrorCapture?: EventHandler<Event>; // also a Media Event

			// Keyboard Events
			onKeyDown?:         EventHandler<KeyboardEvent>;
			onKeyDownCapture?:  EventHandler<KeyboardEvent>;
			onKeyPress?:        EventHandler<KeyboardEvent>;
			onKeyPressCapture?: EventHandler<KeyboardEvent>;
			onKeyUp?:           EventHandler<KeyboardEvent>;
			onKeyUpCapture?:    EventHandler<KeyboardEvent>;

			// Media Events
			onAbort?: EventHandler<Event>;
			onAbortCapture?: EventHandler<Event>;
			onCanPlay?: EventHandler<Event>;
			onCanPlayCapture?: EventHandler<Event>;
			onCanPlayThrough?: EventHandler<Event>;
			onCanPlayThroughCapture?: EventHandler<Event>;
			onDurationChange?: EventHandler<Event>;
			onDurationChangeCapture?: EventHandler<Event>;
			onEmptied?: EventHandler<Event>;
			onEmptiedCapture?: EventHandler<Event>;
			onEncrypted?: EventHandler<Event>;
			onEncryptedCapture?: EventHandler<Event>;
			onEnded?: EventHandler<Event>;
			onEndedCapture?: EventHandler<Event>;
			onLoadedData?: EventHandler<Event>;
			onLoadedDataCapture?: EventHandler<Event>;
			onLoadedMetadata?: EventHandler<Event>;
			onLoadedMetadataCapture?: EventHandler<Event>;
			onLoadStart?: EventHandler<Event>;
			onLoadStartCapture?: EventHandler<Event>;
			onPause?: EventHandler<Event>;
			onPauseCapture?: EventHandler<Event>;
			onPlay?: EventHandler<Event>;
			onPlayCapture?: EventHandler<Event>;
			onPlaying?: EventHandler<Event>;
			onPlayingCapture?: EventHandler<Event>;
			onProgress?: EventHandler<Event>;
			onProgressCapture?: EventHandler<Event>;
			onRateChange?: EventHandler<Event>;
			onRateChangeCapture?: EventHandler<Event>;
			onSeeked?: EventHandler<Event>;
			onSeekedCapture?: EventHandler<Event>;
			onSeeking?: EventHandler<Event>;
			onSeekingCapture?: EventHandler<Event>;
			onStalled?: EventHandler<Event>;
			onStalledCapture?: EventHandler<Event>;
			onSuspend?: EventHandler<Event>;
			onSuspendCapture?: EventHandler<Event>;
			onTimeUpdate?: EventHandler<Event>;
			onTimeUpdateCapture?: EventHandler<Event>;
			onVolumeChange?: EventHandler<Event>;
			onVolumeChangeCapture?: EventHandler<Event>;
			onWaiting?: EventHandler<Event>;
			onWaitingCapture?: EventHandler<Event>;

			// MouseEvents
			onClick?: EventHandler<MouseEvent>;
			onClickCapture?: EventHandler<MouseEvent>;
			onContextMenu?: EventHandler<MouseEvent>;
			onContextMenuCapture?: EventHandler<MouseEvent>;
			onDoubleClick?: EventHandler<MouseEvent>;
			onDoubleClickCapture?: EventHandler<MouseEvent>;
			onDrag?: EventHandler<DragEvent>;
			onDragCapture?: EventHandler<DragEvent>;
			onDragEnd?: EventHandler<DragEvent>;
			onDragEndCapture?: EventHandler<DragEvent>;
			onDragEnter?: EventHandler<DragEvent>;
			onDragEnterCapture?: EventHandler<DragEvent>;
			onDragExit?: EventHandler<DragEvent>;
			onDragExitCapture?: EventHandler<DragEvent>;
			onDragLeave?: EventHandler<DragEvent>;
			onDragLeaveCapture?: EventHandler<DragEvent>;
			onDragOver?: EventHandler<DragEvent>;
			onDragOverCapture?: EventHandler<DragEvent>;
			onDragStart?: EventHandler<DragEvent>;
			onDragStartCapture?: EventHandler<DragEvent>;
			onDrop?: EventHandler<DragEvent>;
			onDropCapture?: EventHandler<DragEvent>;
			onMouseDown?: EventHandler<MouseEvent>;
			onMouseDownCapture?: EventHandler<MouseEvent>;
			onMouseEnter?: EventHandler<MouseEvent>;
			onMouseLeave?: EventHandler<MouseEvent>;
			onMouseMove?: EventHandler<MouseEvent>;
			onMouseMoveCapture?: EventHandler<MouseEvent>;
			onMouseOut?: EventHandler<MouseEvent>;
			onMouseOutCapture?: EventHandler<MouseEvent>;
			onMouseOver?: EventHandler<MouseEvent>;
			onMouseOverCapture?: EventHandler<MouseEvent>;
			onMouseUp?: EventHandler<MouseEvent>;
			onMouseUpCapture?: EventHandler<MouseEvent>;

			// Selection Events
			onSelect?: EventHandler<Event>;
			onSelectCapture?: EventHandler<Event>;

			// Touch Events
			onTouchCancel?: EventHandler<TouchEvent>;
			onTouchCancelCapture?: EventHandler<TouchEvent>;
			onTouchEnd?: EventHandler<TouchEvent>;
			onTouchEndCapture?: EventHandler<TouchEvent>;
			onTouchMove?: EventHandler<TouchEvent>;
			onTouchMoveCapture?: EventHandler<TouchEvent>;
			onTouchStart?: EventHandler<TouchEvent>;
			onTouchStartCapture?: EventHandler<TouchEvent>;

			// UI Events
			onScroll?: EventHandler<UIEvent>;
			onScrollCapture?: EventHandler<UIEvent>;

			// Wheel Events
			onWheel?: EventHandler<WheelEvent>;
			onWheelCapture?: EventHandler<WheelEvent>;

			// Animation Events
			onAnimationStart?: EventHandler<AnimationEvent>;
			onAnimationStartCapture?: EventHandler<AnimationEvent>;
			onAnimationEnd?: EventHandler<AnimationEvent>;
			onAnimationEndCapture?: EventHandler<AnimationEvent>;
			onAnimationIteration?: EventHandler<AnimationEvent>;
			onAnimationIterationCapture?: EventHandler<AnimationEvent>;

			// Transition Events
			onTransitionEnd?: EventHandler<TransitionEvent>;
			onTransitionEndCapture?: EventHandler<TransitionEvent>;
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
