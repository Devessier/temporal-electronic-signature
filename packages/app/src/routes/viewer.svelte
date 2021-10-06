<script lang="ts">
	import AppLayout from '$lib/AppLayout.svelte';
	import { useAppContext } from '$lib/contexts/app';
	import PdfViewer from '$lib/PdfViewer.svelte';

	const { state, send } = useAppContext();

	$: documentURL =
		$state.context.documentUrl ||
		`http://localhost:3333/uploads/ckug295zw0003a14z9uae0as3.pdf?signature=eyJtZXNzYWdlIjoiL3VwbG9hZHMvY2t1ZzI5NXp3MDAwM2ExNHo5dWFlMGFzMy5wZGYiLCJleHBpcnlEYXRlIjoiMjAyMS0xMC0wNlQyMjozNjozNy43NTBaIn0.Mlx04XZw-KwH5LZYUc9PgRtFRqhQy3TwrvbylkNCm0c`;

	function handleCancelProcedureClick() {}

	function handleConfirmProcedureClick() {}
</script>

<AppLayout title="Sign document">
	<div class="mt-2 flex flex-col flex-grow">
		{#if documentURL}
			<div class="flex-grow grid grid-cols-1 grid-rows-1">
				<PdfViewer url={documentURL} title="Document to sign" />
			</div>
		{/if}

		<div class="pt-5">
			<div class="flex justify-end">
				<button
					type="button"
					class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					on:click={handleCancelProcedureClick}
				>
					Cancel
				</button>

				<button
					type="submit"
					class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					on:click={handleConfirmProcedureClick}
				>
					Sign
				</button>
			</div>
		</div>
	</div>
</AppLayout>
