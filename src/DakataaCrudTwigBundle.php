<?php

namespace Dakataa\Crud\Twig;

use Dakataa\Crud\Twig\Extension\CrudExtension;
use Dakataa\Crud\Twig\Extension\NavigationExtension;
use Symfony\Component\Config\Definition\Configurator\DefinitionConfigurator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Bundle\AbstractBundle;

class DakataaCrudTwigBundle extends AbstractBundle
{
	const NAME = 'dakataa_crud';

	public function configure(DefinitionConfigurator $definition): void
	{
		$definition
			->rootNode()
			->children()
			->variableNode('layout')//->isRequired()
			->end()
			->end();
	}

	public function loadExtension(array $config, ContainerConfigurator $container, ContainerBuilder $builder): void
	{
		$container
			->services()
			->set(CrudExtension::class, CrudExtension::class)
			->tag('twig.extension')
			->autowire();

		$container
			->services()
			->set(NavigationExtension::class, NavigationExtension::class)
			->tag('twig.extension')
			->autowire();

		$container
			->services()
			->set(TemplateProvider::class, TemplateProvider::class)
			->autowire();

		$container->parameters()->set(self::NAME, $config);
	}

	public function prependExtension(
		ContainerConfigurator $container,
		ContainerBuilder $builder
	): void {
		$builder->prependExtensionConfig('framework', [
			'assets' => [
				'packages' => [
					self::NAME => [
						'json_manifest_path' => '%kernel.project_dir%/public/bundles/dakataacrudtwig/assets/manifest.json'
					]
				]
			]
		]);
	}
}
