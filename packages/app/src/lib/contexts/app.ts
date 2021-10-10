import { appMachine } from '$lib/machines/appMachine';
import { useMachine } from '@xstate/svelte';
import { getContext, setContext } from 'svelte';
import type { Readable } from 'svelte/store';
import type {
	EventFrom,
	InterpreterFrom,
	Sender,
	StateFrom,
	MachineOptions,
	ContextFrom
} from 'xstate';

const AppContextSymbol = Symbol('AppContextSymbol');

interface AppContext {
	state: Readable<StateFrom<typeof appMachine>>;
	send: Sender<EventFrom<typeof appMachine>>;
	service: InterpreterFrom<typeof appMachine>;
}

export function useAppContextProvider(
	config?: Partial<MachineOptions<ContextFrom<typeof appMachine>, EventFrom<typeof appMachine>>>
): AppContext {
	const appContext = useMachine(appMachine, config);

	// To prevent issues where state machine would be stopped
	// because the store has been unsubscribed by the previous page
	// while going to another page, we keep a subscriber alive for
	// all the navigation.
	appContext.state.subscribe(({ value }) => {
		console.log('state machine value', value);
	});

	appContext.service.onStop(() => {
		console.log('machine stopped');
	});

	setContext(AppContextSymbol, appContext);

	return appContext;
}

export function useAppContext(): AppContext {
	const appContext = getContext<AppContext>(AppContextSymbol);
	if (appContext === undefined) {
		throw new Error('useAppContext must be used after provideAppContext');
	}

	return appContext;
}
