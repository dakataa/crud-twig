<?php

namespace Dakataa\Crud\Twig\Extension;

use Dakataa\Crud\Attribute\Action;
use Dakataa\Crud\DakataaCrudBundle;
use Dakataa\Crud\EventSubscriber\CrudSubscriber;
use Dakataa\Crud\Service\ActionCollection;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Route;
use Symfony\Component\Routing\RouterInterface;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;

class CrudExtension extends AbstractExtension
{

	public function __construct(
		protected RequestStack $requestStack,
		protected EntityManagerInterface $entityManager,
		protected RouterInterface $router,
		protected ParameterBagInterface $parameterBag,
		protected CrudSubscriber $crudSubscriber,
		protected ActionCollection $actionCollection
	) {
	}

	public function getFunctions(): array
	{
		return [
			new TwigFunction('hasAction', [$this, 'hasAction']),
			new TwigFunction('generatePath', [$this, 'generatePath']),
			new TwigFunction('generatePathByAction', [$this, 'generatePathByAction']),
			new TwigFunction('getAction', [$this, 'getAction']),
			new TwigFunction('getRoute', [$this, 'getRoute']),
			new TwigFunction('entityPrimaryKey', [$this, 'entityPrimaryKey']),
			new TwigFunction('controllerClass', [$this, 'getControllerClass']),
			new TwigFunction('getParameter', [$this, 'getParameter']),
		];
	}

	public function getFilters(): array
	{
		return [
			new TwigFilter('entityPrimaryKey', [$this, 'entityPrimaryKey']),
		];
	}

	public function entityPrimaryKey(object $entity): mixed
	{
		return $this->entityManager->getClassMetadata(get_class($entity))->getSingleIdReflectionProperty()->getValue(
			$entity
		);
	}

	public function getAction(
		string $entityName,
		string $actionName,
		string $namespace = null,
		bool $strict = true
	): ?Action {
		$action = array_values(
			array_filter(
				iterator_to_array($this->actionCollection->getAll()),
				fn(Action $action) => $action->entity === $entityName && $action->getName() === $actionName && (!$namespace || $action->namespace === $namespace)
			)
		)[0] ?? null;

		if ($strict && null === $action) {
			throw new Exception(sprintf('Action "%s" for entity "%s" not found.', $actionName, $entityName));
		}

		return $action;
	}

	public function getRoute(string $actionName, string $controllerFQCN = null): string
	{
		$controllerFQCN ??= $this->getControllerClass();
		$actions = $this->crudSubscriber->getController()?->getActions();

		return (array_values(array_filter($actions, fn(Action $action) => $action->getName() === $actionName))[0] ?? null)?->getRoute()->getName() ?? ($controllerFQCN.'::'.$actionName);
	}

	public function hasAction(string $actionName): bool
	{
		$actions = $this->crudSubscriber->getController()?->getActions();

		return !empty(array_filter($actions, fn(Action $action) => $action->getName() === $actionName));
	}

	public function generatePathByAction(Action $action, array $parameters = null): ?string
	{
		if (!$action->getRoute()) {
			throw new Exception('Cannot generate Path for Action without Route.');
		}

		$routePathVariables = $this->router->getRouteCollection()->get($action->getRoute()->getName())?->compile()->getPathVariables() ?: [];
		$currentPathParameters = array_intersect_key(
			$this->requestStack->getMainRequest()->attributes->all(),
			array_flip($routePathVariables)
		);

		return $this->router->generate($action->getRoute()->getName(), array_merge($currentPathParameters, $parameters ?? []));
	}

	public function generatePath(): string
	{
		$arguments = func_get_args();
		$isClassPassed = class_exists($arguments[0]);
		$controllerFqcn = $isClassPassed ? $arguments[0] : $this->getControllerClass();
		$method = ($isClassPassed ? $arguments[1] : $arguments[0]);
		$parameters = ($isClassPassed ? ($arguments[2] ?? []) : ($arguments[1] ?? []));

		if ($parameters && !is_array($parameters)) {
			throw new Exception('Invalid Argument "$parameters" its should be array.');
		}

		$routeName = $this->getRoute($method, $controllerFqcn);
		$routePathVariables = $this->router->getRouteCollection()->get($routeName)->compile()->getPathVariables();

		$currentPathParameters = array_intersect_key(
			$this->requestStack->getMainRequest()->attributes->all(),
			array_flip($routePathVariables)
		);

		return $this->router->generate(
			$routeName,
			array_merge($currentPathParameters, $parameters)
		);
	}

	public function getControllerClass(): string
	{
		return explode('::', $this->requestStack->getMainRequest()->attributes->get('_controller'))[0];
	}

	public function getParameter(string $key): mixed
	{
		return $this->parameterBag->get(DakataaCrudBundle::NAME)[$key] ?? null;
	}
}
