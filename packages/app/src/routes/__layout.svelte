<script>
	import '../app.css';
	import { goto } from '$app/navigation';
	import { useAppContextProvider } from '$lib/contexts/app';

	const { state } = useAppContextProvider({
		actions: {
			redirectToViewerPage: () => {
				goto('/viewer');
			},

			redirectToSignatureCanceledPage: () => {
				goto('/signature-cancelled');
			},

			redirectToEmailPage: () => {
				goto('/email');
			},

			redirectToConfirmationCodePage: () => {
				goto('/confirmation-code');
			}
		}
	});

	$: console.log('state machine value', $state.value);
</script>

<div class="min-h-screen bg-white flex flex-col">
	<nav class="bg-white border-b border-gray-200">
		<div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<a href="/" class="text-xl font-medium leading-6 text-gray-900 sm:truncate">
					Temporal Signature
				</a>

				<a
					href="/create"
					class="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Create
				</a>
			</div>
		</div>
	</nav>

	<div class="py-10 flex-grow flex flex-col">
		<slot />
	</div>
</div>
