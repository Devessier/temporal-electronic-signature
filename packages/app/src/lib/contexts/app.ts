import { appMachine } from '$lib/machines/appMachine';
import { useMachine } from '@xstate/svelte';
import { getContext, setContext } from 'svelte';
import type { Readable } from 'svelte/store';
import type { EventFrom, InterpreterFrom, Sender, StateFrom } from 'xstate';

const AppContextSymbol = Symbol('AppContextSymbol');

interface AppContext {
	state: Readable<StateFrom<typeof appMachine>>;
	send: Sender<EventFrom<typeof appMachine>>;
	service: InterpreterFrom<typeof appMachine>;
}

export function provideAppContext(): void {
	const appContext = useMachine(appMachine);

	setContext(AppContextSymbol, appContext);
}

export function useAppContext(): AppContext {
	const appContext = getContext<AppContext>(AppContextSymbol);
	if (appContext === undefined) {
		throw new Error('useAppContext must be used after provideAppContext');
	}

	return appContext;
}
